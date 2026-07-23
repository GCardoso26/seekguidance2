"""PDV — vendas presenciais no balcão."""

from __future__ import annotations

import json
import uuid
from datetime import UTC, datetime, timedelta
from typing import Any

from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.marketplace.pix_gateway import get_pix_gateway
from app.marketplace.shop_pix import _build_copy_payload, _qr_base64
from app.marketplace.shop_store import store_plan_has_feature

PDV_PIX_EXPIRY_MINUTES = 5


def _parse_pdv_notes(notes: str | None) -> dict[str, Any]:
    if not notes:
        return {}
    try:
        data = json.loads(notes)
        return data if isinstance(data, dict) else {}
    except json.JSONDecodeError:
        return {}


def _pending_notes(txid: str) -> str:
    return json.dumps({"pdv_status": "pending", "txid": txid, "stock_committed": False})


def _paid_notes(txid: str) -> str:
    return json.dumps(
        {
            "pdv_status": "paid",
            "txid": txid,
            "stock_committed": True,
            "paid_at": datetime.now(UTC).isoformat(),
        }
    )


async def _assert_store_owner(session: AsyncSession, store_id: str, owner_id: str) -> dict[str, Any]:
    row = (
        await session.execute(
            text("SELECT * FROM tcg_judge.stores WHERE id = :id AND owner_id = :oid"),
            {"id": store_id, "oid": owner_id},
        )
    ).mappings().first()
    if not row:
        raise HTTPException(404, "Loja não encontrada")
    return dict(row)


async def _normalize_pdv_items(
    session: AsyncSession, store_id: str, items: list[dict[str, Any]]
) -> tuple[list[dict[str, Any]], int]:
    if not items:
        raise HTTPException(400, "Carrinho vazio")

    total = 0
    normalized: list[dict[str, Any]] = []
    for item in items:
        qty = max(1, int(item.get("quantity") or 1))
        price = max(0, int(item.get("price_cents") or 0))
        line_total = price * qty
        total += line_total

        source = str(item.get("source") or "").strip().lower()
        local_product_id = item.get("local_product_id")
        product_id = item.get("product_id")
        if not source:
            if local_product_id:
                source = "local"
            elif product_id:
                source = "official"

        if source == "local":
            lid = local_product_id or product_id
            if not lid:
                raise HTTPException(400, "Produto local sem id")
            prod = (
                await session.execute(
                    text(
                        """
                        SELECT id, stock, name, category, cost_cents, active
                        FROM pdv.local_products
                        WHERE id = :id AND store_id = :sid
                        """
                    ),
                    {"id": lid, "sid": store_id},
                )
            ).mappings().first()
            if not prod or not prod.get("active"):
                raise HTTPException(400, f"Produto local não encontrado: {lid}")
            stock = prod.get("stock")
            if stock is not None and int(stock) < qty:
                raise HTTPException(400, f"Estoque insuficiente: {prod['name']}")
            cost = prod.get("cost_cents")
            normalized.append(
                {
                    "source": "local",
                    "local_product_id": str(prod["id"]),
                    "product_id": None,
                    "name": item.get("name") or prod["name"],
                    "category": prod.get("category"),
                    "quantity": qty,
                    "price_cents": price,
                    "cost_cents": int(cost) if cost is not None else None,
                    "line_total_cents": line_total,
                }
            )
            continue

        if product_id:
            prod = (
                await session.execute(
                    text(
                        """
                        SELECT id, stock, name FROM tcg_judge.store_products
                        WHERE id = :id AND store_id = :sid
                        """
                    ),
                    {"id": product_id, "sid": store_id},
                )
            ).mappings().first()
            if not prod:
                raise HTTPException(400, f"Produto não encontrado: {product_id}")
            if int(prod["stock"]) < qty:
                raise HTTPException(400, f"Estoque insuficiente: {prod['name']}")
        normalized.append(
            {
                "source": "official",
                "product_id": product_id,
                "local_product_id": None,
                "name": item.get("name") or "Item",
                "quantity": qty,
                "price_cents": price,
                "line_total_cents": line_total,
            }
        )
    return normalized, total


async def _commit_pdv_stock(session: AsyncSession, store_id: str, normalized: list[dict[str, Any]]) -> None:
    for item in normalized:
        qty = int(item["quantity"])
        source = str(item.get("source") or "official")

        if source == "local":
            local_id = item.get("local_product_id")
            if not local_id:
                continue
            # NULL stock = infinite — skip debit
            current = (
                await session.execute(
                    text(
                        """
                        SELECT stock, name FROM pdv.local_products
                        WHERE id = :id AND store_id = :sid
                        """
                    ),
                    {"id": local_id, "sid": store_id},
                )
            ).mappings().first()
            if not current:
                raise HTTPException(400, f"Produto local não encontrado: {item.get('name')}")
            if current.get("stock") is None:
                continue
            updated = (
                await session.execute(
                    text(
                        """
                        UPDATE pdv.local_products
                        SET stock = stock - :qty, updated_at = NOW()
                        WHERE id = :id AND store_id = :sid
                          AND stock IS NOT NULL AND stock >= :qty
                        RETURNING id
                        """
                    ),
                    {"qty": qty, "id": local_id, "sid": store_id},
                )
            ).mappings().first()
            if not updated:
                raise HTTPException(400, f"Estoque insuficiente: {item.get('name')}")
            continue

        product_id = item.get("product_id")
        if not product_id:
            continue
        updated = (
            await session.execute(
                text(
                    """
                    UPDATE tcg_judge.store_products
                    SET stock = stock - :qty, updated_at = NOW()
                    WHERE id = :id AND store_id = :sid AND stock >= :qty
                    RETURNING id
                    """
                ),
                {"qty": qty, "id": product_id, "sid": store_id},
            )
        ).mappings().first()
        if not updated:
            raise HTTPException(400, f"Estoque insuficiente: {item.get('name')}")


async def create_pdv_sale(
    session: AsyncSession,
    store_id: str,
    seller_id: str,
    *,
    items: list[dict[str, Any]],
    payment_method: str = "cash",
    notes: str | None = None,
) -> dict[str, Any]:
    store = await _assert_store_owner(session, store_id, seller_id)
    if not store_plan_has_feature(store, "pdv"):
        raise HTTPException(403, "PDV disponível no plano Pro ou superior")
    if payment_method not in {"cash", "pix", "card"}:
        raise HTTPException(400, "Método de pagamento inválido")

    normalized, total = await _normalize_pdv_items(session, store_id, items)
    await _commit_pdv_stock(session, store_id, normalized)

    row = (
        await session.execute(
            text(
                """
                INSERT INTO tcg_judge.pdv_sales (store_id, seller_id, items, total_cents, payment_method, notes)
                VALUES (:sid, :seller, CAST(:items AS jsonb), :total, :pm, :notes)
                RETURNING *
                """
            ),
            {
                "sid": store_id,
                "seller": seller_id,
                "items": json.dumps(normalized),
                "total": total,
                "pm": payment_method,
                "notes": notes,
            },
        )
    ).mappings().first()
    await session.commit()
    return dict(row) if row else {}


async def list_pdv_sales(
    session: AsyncSession, store_id: str, owner_id: str, *, limit: int = 30
) -> list[dict[str, Any]]:
    store = await _assert_store_owner(session, store_id, owner_id)
    if not store_plan_has_feature(store, "pdv"):
        raise HTTPException(403, "PDV disponível no plano Pro ou superior")

    rows = (
        await session.execute(
            text(
                """
                SELECT * FROM tcg_judge.pdv_sales
                WHERE store_id = :sid
                ORDER BY created_at DESC
                LIMIT :lim
                """
            ),
            {"sid": store_id, "lim": min(limit, 100)},
        )
    ).mappings().all()
    return [dict(r) for r in rows]


async def create_pdv_pix_charge(
    session: AsyncSession,
    store_id: str,
    seller_id: str,
    *,
    items: list[dict[str, Any]],
) -> dict[str, Any]:
    store = await _assert_store_owner(session, store_id, seller_id)
    if not store_plan_has_feature(store, "pdv"):
        raise HTTPException(403, "PDV disponível no plano Pro ou superior")

    normalized, total = await _normalize_pdv_items(session, store_id, items)
    pix_key = str(store.get("pix_key") or "").strip()
    settings = get_settings()
    gateway = get_pix_gateway(settings)
    gateway_provider = (
        "openpix" if settings.openpix_api_key else "asaas" if settings.asaas_api_key else "manual"
    )

    if not pix_key and gateway_provider == "manual":
        raise HTTPException(400, "Configure a chave PIX da loja em Configurações")

    txid = f"pdv-{uuid.uuid4().hex[:16]}"
    expires_at = datetime.now(UTC) + timedelta(minutes=PDV_PIX_EXPIRY_MINUTES)
    expiry_seconds = PDV_PIX_EXPIRY_MINUTES * 60
    store_name = str(store.get("name") or "Loja")

    gateway_result = await gateway.create_charge(
        txid=txid,
        amount_cents=total,
        pix_key=pix_key,
        pix_key_type=str(store.get("pix_key_type") or "random"),
        description=f"PDV {store_name}"[:140],
        expires_in_seconds=expiry_seconds,
    )

    copy_payload = gateway_result.get("copy_payload") or _build_copy_payload(
        store_name=store_name,
        pix_key=pix_key,
        amount_cents=total,
        txid=txid,
    )
    qr_raw = gateway_result.get("qr_code")
    qr_b64 = qr_raw if isinstance(qr_raw, str) and qr_raw.startswith("data:") else (
        f"data:image/png;base64,{qr_raw}" if qr_raw else (
            f"data:image/png;base64,{_qr_base64(copy_payload)}" if _qr_base64(copy_payload) else None
        )
    )

    sale_row = (
        await session.execute(
            text(
                """
                INSERT INTO tcg_judge.pdv_sales (store_id, seller_id, items, total_cents, payment_method, notes)
                VALUES (:sid, :seller, CAST(:items AS jsonb), :total, 'pix', :notes)
                RETURNING *
                """
            ),
            {
                "sid": store_id,
                "seller": seller_id,
                "items": json.dumps(normalized),
                "total": total,
                "notes": _pending_notes(txid),
            },
        )
    ).mappings().first()
    if not sale_row:
        raise HTTPException(500, "Falha ao criar venda PDV pendente")
    sale = dict(sale_row)
    sale_id = str(sale["id"])

    await session.execute(
        text(
            """
            INSERT INTO tcg_judge.pix_transactions (
              order_id, txid, pix_key, amount_cents, status, expires_at, payload,
              gateway_provider, gateway_charge_id
            ) VALUES (
              NULL, :txid, :key, :amt, 'pending', :exp, :payload,
              :provider, :charge_id
            )
            """
        ),
        {
            "txid": txid,
            "key": pix_key or "platform",
            "amt": total,
            "exp": expires_at,
            "payload": json.dumps(
                {
                    "source": "pdv",
                    "pdv_sale_id": sale_id,
                    "store_id": store_id,
                    "copy_payload": copy_payload,
                    "qr_code": qr_b64,
                }
            ),
            "provider": gateway_result.get("gateway_provider") or gateway_provider,
            "charge_id": gateway_result.get("gateway_charge_id"),
        },
    )
    await session.commit()

    mode = "gateway" if gateway_provider != "manual" else "manual"
    return {
        "mode": mode,
        "transaction_id": txid,
        "txid": txid,
        "sale_id": sale_id,
        "pix_qr_code": qr_b64,
        "qr_code": qr_b64,
        "copy_payload": copy_payload,
        "pix_key": pix_key,
        "store_name": store_name,
        "amount_cents": total,
        "expires_at": expires_at.isoformat(),
    }


async def _load_pdv_pix_tx(session: AsyncSession, store_id: str, transaction_id: str) -> dict[str, Any]:
    row = (
        await session.execute(
            text("SELECT * FROM tcg_judge.pix_transactions WHERE txid = :txid"),
            {"txid": transaction_id},
        )
    ).mappings().first()
    if not row:
        raise HTTPException(404, "Transação PIX não encontrada")

    payload: dict[str, Any] = {}
    raw = row.get("payload")
    if raw:
        try:
            payload = json.loads(raw) if isinstance(raw, str) else dict(raw or {})
        except (json.JSONDecodeError, TypeError):
            payload = {}

    if payload.get("source") != "pdv" or payload.get("store_id") != store_id:
        raise HTTPException(404, "Transação PIX não encontrada")
    return {**dict(row), "pdv_payload": payload}


async def confirm_pdv_pix_sale(
    session: AsyncSession, store_id: str, seller_id: str, sale_id: str
) -> dict[str, Any]:
    store = await _assert_store_owner(session, store_id, seller_id)
    if not store_plan_has_feature(store, "pdv"):
        raise HTTPException(403, "PDV disponível no plano Pro ou superior")

    sale_row = (
        await session.execute(
            text(
                """
                SELECT * FROM tcg_judge.pdv_sales
                WHERE id = :id AND store_id = :sid AND seller_id = :seller
                """
            ),
            {"id": sale_id, "sid": store_id, "seller": seller_id},
        )
    ).mappings().first()
    if not sale_row:
        raise HTTPException(404, "Venda PDV não encontrada")

    sale = dict(sale_row)
    meta = _parse_pdv_notes(sale.get("notes"))
    if meta.get("pdv_status") == "paid" and meta.get("stock_committed"):
        return sale

    if meta.get("pdv_status") != "pending":
        raise HTTPException(400, "Venda não está pendente de PIX")

    items = sale.get("items")
    if isinstance(items, str):
        items = json.loads(items)
    normalized = items if isinstance(items, list) else []

    await _commit_pdv_stock(session, store_id, normalized)

    txid = str(meta.get("txid") or "")
    updated = (
        await session.execute(
            text(
                """
                UPDATE tcg_judge.pdv_sales
                SET notes = :notes
                WHERE id = :id
                RETURNING *
                """
            ),
            {"id": sale_id, "notes": _paid_notes(txid)},
        )
    ).mappings().first()

    if txid:
        await session.execute(
            text(
                """
                UPDATE tcg_judge.pix_transactions
                SET status = 'paid', paid_at = NOW()
                WHERE txid = :txid AND status = 'pending'
                """
            ),
            {"txid": txid},
        )

    await session.commit()
    return dict(updated) if updated else sale


async def get_pdv_pix_status(
    session: AsyncSession, store_id: str, seller_id: str, transaction_id: str
) -> dict[str, Any]:
    await _assert_store_owner(session, store_id, seller_id)
    row = await _load_pdv_pix_tx(session, store_id, transaction_id)
    payload = row["pdv_payload"]
    sale_id = str(payload.get("pdv_sale_id") or "")
    status = str(row.get("status") or "pending")
    expires_at = row.get("expires_at")

    if status == "pending" and expires_at:
        exp = expires_at if isinstance(expires_at, datetime) else datetime.fromisoformat(str(expires_at))
        if exp.tzinfo is None:
            exp = exp.replace(tzinfo=UTC)
        if exp < datetime.now(UTC):
            await session.execute(
                text("UPDATE tcg_judge.pix_transactions SET status = 'expired' WHERE txid = :txid"),
                {"txid": transaction_id},
            )
            await session.commit()
            status = "expired"

    if status == "paid" and sale_id:
        sale = await confirm_pdv_pix_sale(session, store_id, seller_id, sale_id)
        return {
            "status": "paid",
            "transaction_id": transaction_id,
            "sale_id": sale_id,
            "sale": sale,
        }

    return {
        "status": status,
        "transaction_id": transaction_id,
        "sale_id": sale_id or None,
        "expires_at": expires_at.isoformat() if isinstance(expires_at, datetime) else expires_at,
    }


async def patch_pdv_sale(
    session: AsyncSession,
    store_id: str,
    seller_id: str,
    sale_id: str,
    *,
    status: str = "paid",
) -> dict[str, Any]:
    if status != "paid":
        raise HTTPException(400, "Status inválido")
    sale = await confirm_pdv_pix_sale(session, store_id, seller_id, sale_id)
    return {"sale": sale}


async def search_pdv_products(
    session: AsyncSession, store_id: str, owner_id: str, q: str, *, limit: int = 20
) -> list[dict[str, Any]]:
    await _assert_store_owner(session, store_id, owner_id)
    term = q.strip()
    if not term:
        return []

    half = max(1, min(limit, 50) // 2)
    official_rows = (
        await session.execute(
            text(
                """
                SELECT id, name, price_cents, stock, sku, category, images, NULL::text AS barcode
                FROM tcg_judge.store_products
                WHERE store_id = :sid AND is_active
                  AND (name ILIKE :q OR sku ILIKE :q)
                ORDER BY name
                LIMIT :lim
                """
            ),
            {"sid": store_id, "q": f"%{term}%", "lim": half},
        )
    ).mappings().all()

    local_rows = (
        await session.execute(
            text(
                """
                SELECT id, name, price_cents, stock, sku, category,
                       NULL::jsonb AS images, barcode
                FROM pdv.local_products
                WHERE store_id = :sid AND active
                  AND (
                    name ILIKE :q
                    OR sku ILIKE :q
                    OR barcode ILIKE :q
                    OR lower(coalesce(sku, '')) = lower(:exact)
                    OR lower(coalesce(barcode, '')) = lower(:exact)
                  )
                ORDER BY name
                LIMIT :lim
                """
            ),
            {"sid": store_id, "q": f"%{term}%", "exact": term, "lim": half},
        )
    ).mappings().all()

    results: list[dict[str, Any]] = []
    for r in local_rows:
        row = dict(r)
        row["source"] = "local"
        row["local_product_id"] = str(row["id"])
        results.append(row)
    for r in official_rows:
        row = dict(r)
        row["source"] = "official"
        results.append(row)
    return results
