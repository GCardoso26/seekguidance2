"""BuyList — ofertas de compra de coleção com link público."""

from __future__ import annotations

import json
import secrets
from typing import Any

from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.marketplace.shop_store import store_plan_has_feature


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


def _require_buylist_plan(store: dict[str, Any]) -> None:
    if not store_plan_has_feature(store, "buylist"):
        raise HTTPException(403, "BuyList disponível no plano Lojista ou superior")


async def _market_price_cents(session: AsyncSession, card_id: str | None) -> int | None:
    if not card_id:
        return None
    row = (
        await session.execute(
            text(
                """
                SELECT MIN(price_cents) AS min_cents
                FROM tcg_judge.card_prices
                WHERE card_id = :cid
                """
            ),
            {"cid": card_id},
        )
    ).mappings().first()
    if row and row["min_cents"] is not None:
        return int(row["min_cents"])

    card_row = (
        await session.execute(
            text(
                """
                SELECT name, set_code, game_code
                FROM tcg_judge.card_catalog
                WHERE id = :cid
                """
            ),
            {"cid": card_id},
        )
    ).mappings().first()
    if not card_row:
        return None

    from app.pricing.tcgapi_sync import fetch_tcgapi_price_cents

    game_slug = str(card_row.get("game_code") or "MTG").lower()
    return await fetch_tcgapi_price_cents(
        str(card_row["name"]),
        game=game_slug,
        set_code=card_row.get("set_code"),
    )


def _offer_from_market(market_cents: int | None, discount_pct: float, fallback_cents: int = 0) -> int:
    if market_cents and market_cents > 0:
        return max(1, int(market_cents * (1 - discount_pct)))
    return fallback_cents


async def create_buylist(
    session: AsyncSession,
    store_id: str,
    owner_id: str,
    *,
    title: str,
    discount_pct: float = 0.30,
    notes: str | None = None,
    items: list[dict[str, Any]],
) -> dict[str, Any]:
    store = await _assert_store_owner(session, store_id, owner_id)
    _require_buylist_plan(store)
    if not items:
        raise HTTPException(400, "Adicione ao menos um item")

    token = secrets.token_urlsafe(16)[:24]
    buylist = (
        await session.execute(
            text(
                """
                INSERT INTO tcg_judge.buylists (store_id, title, discount_pct, public_token, notes)
                VALUES (:sid, :title, :disc, :token, :notes)
                RETURNING *
                """
            ),
            {
                "sid": store_id,
                "title": title.strip()[:200],
                "disc": discount_pct,
                "token": token,
                "notes": notes,
            },
        )
    ).mappings().first()

    buylist_id = str(buylist["id"])
    total_offer = 0
    inserted: list[dict[str, Any]] = []

    for raw in items:
        card_id = raw.get("card_id")
        card_name = str(raw.get("card_name") or "").strip()
        if not card_name:
            continue
        qty = max(1, int(raw.get("quantity") or 1))
        market = await _market_price_cents(session, str(card_id) if card_id else None)
        offer = raw.get("offer_cents")
        if offer is None:
            offer = _offer_from_market(market, discount_pct)
        offer_cents = max(0, int(offer))
        total_offer += offer_cents * qty

        row = (
            await session.execute(
                text(
                    """
                    INSERT INTO tcg_judge.buylist_items (
                      buylist_id, card_id, card_name, set_code, quantity, condition,
                      market_cents, offer_cents
                    ) VALUES (
                      :bid, :cid, :name, :set_code, :qty, :cond, :market, :offer
                    )
                    RETURNING *
                    """
                ),
                {
                    "bid": buylist_id,
                    "cid": card_id,
                    "name": card_name[:200],
                    "set_code": raw.get("set_code"),
                    "qty": qty,
                    "cond": raw.get("condition") or "near_mint",
                    "market": market,
                    "offer": offer_cents,
                },
            )
        ).mappings().first()
        if row:
            inserted.append(dict(row))

    await session.commit()
    result = dict(buylist) if buylist else {}
    result["items"] = inserted
    result["total_offer_cents"] = total_offer
    result["public_url_path"] = f"/buylist/{token}"
    return result


async def list_store_buylists(
    session: AsyncSession, store_id: str, owner_id: str
) -> list[dict[str, Any]]:
    store = await _assert_store_owner(session, store_id, owner_id)
    _require_buylist_plan(store)
    rows = (
        await session.execute(
            text(
                """
                SELECT b.*,
                       COALESCE(SUM(i.offer_cents * i.quantity), 0) AS total_offer_cents,
                       COUNT(i.id) AS item_count
                FROM tcg_judge.buylists b
                LEFT JOIN tcg_judge.buylist_items i ON i.buylist_id = b.id
                WHERE b.store_id = :sid
                GROUP BY b.id
                ORDER BY b.created_at DESC
                """
            ),
            {"sid": store_id},
        )
    ).mappings().all()
    return [dict(r) for r in rows]


async def get_buylist_by_token(session: AsyncSession, token: str) -> dict[str, Any]:
    buylist = (
        await session.execute(
            text(
                """
                SELECT b.*, s.name AS store_name, s.slug AS store_slug, s.logo_url AS store_logo_url
                FROM tcg_judge.buylists b
                JOIN tcg_judge.stores s ON s.id = b.store_id
                WHERE b.public_token = :token AND b.status = 'active'
                """
            ),
            {"token": token},
        )
    ).mappings().first()
    if not buylist:
        raise HTTPException(404, "Oferta não encontrada")

    items = (
        await session.execute(
            text("SELECT * FROM tcg_judge.buylist_items WHERE buylist_id = :bid ORDER BY card_name"),
            {"bid": str(buylist["id"])},
        )
    ).mappings().all()

    total = sum(int(i["offer_cents"]) * int(i["quantity"]) for i in items)
    result = dict(buylist)
    result["items"] = [dict(i) for i in items]
    result["total_offer_cents"] = total
    return result


async def submit_buylist(
    session: AsyncSession,
    token: str,
    seller_user_id: str,
    *,
    message: str | None = None,
) -> dict[str, Any]:
    buylist = await get_buylist_by_token(session, token)
    store_id = str(buylist["store_id"])
    total = int(buylist.get("total_offer_cents") or 0)

    row = (
        await session.execute(
            text(
                """
                INSERT INTO tcg_judge.buylist_submissions (
                  buylist_id, store_id, seller_user_id, total_offer_cents, message
                ) VALUES (:bid, :sid, :uid, :total, :msg)
                RETURNING *
                """
            ),
            {
                "bid": str(buylist["id"]),
                "sid": store_id,
                "uid": seller_user_id,
                "total": total,
                "msg": message,
            },
        )
    ).mappings().first()
    await session.commit()
    return dict(row) if row else {}


async def list_submissions(
    session: AsyncSession, store_id: str, owner_id: str, *, status: str | None = None
) -> list[dict[str, Any]]:
    await _assert_store_owner(session, store_id, owner_id)
    clauses = ["bs.store_id = :sid"]
    params: dict[str, Any] = {"sid": store_id}
    if status:
        clauses.append("bs.status = :st")
        params["st"] = status

    rows = (
        await session.execute(
            text(
                f"""
                SELECT bs.*, b.title AS buylist_title, b.public_token,
                       o.status AS order_status, o.pix_txid AS order_pix_txid
                FROM tcg_judge.buylist_submissions bs
                JOIN tcg_judge.buylists b ON b.id = bs.buylist_id
                LEFT JOIN tcg_judge.shop_orders o ON o.id = bs.shop_order_id
                WHERE {' AND '.join(clauses)}
                ORDER BY bs.created_at DESC
                LIMIT 100
                """
            ),
            params,
        )
    ).mappings().all()
    return [dict(r) for r in rows]


async def update_submission_status(
    session: AsyncSession,
    submission_id: str,
    store_id: str,
    owner_id: str,
    status: str,
) -> dict[str, Any]:
    if status not in {"accepted", "rejected", "completed", "cancelled"}:
        raise HTTPException(400, "Status inválido")
    store = await _assert_store_owner(session, store_id, owner_id)

    existing = (
        await session.execute(
            text(
                """
                SELECT bs.*, b.title AS buylist_title
                FROM tcg_judge.buylist_submissions bs
                JOIN tcg_judge.buylists b ON b.id = bs.buylist_id
                WHERE bs.id = :id AND bs.store_id = :sid
                """
            ),
            {"id": submission_id, "sid": store_id},
        )
    ).mappings().first()
    if not existing:
        raise HTTPException(404, "Proposta não encontrada")
    if existing["status"] != "pending" and status == "accepted":
        raise HTTPException(400, "Proposta já processada")

    row = (
        await session.execute(
            text(
                """
                UPDATE tcg_judge.buylist_submissions
                SET status = :st, updated_at = NOW()
                WHERE id = :id AND store_id = :sid
                RETURNING *
                """
            ),
            {"st": status, "id": submission_id, "sid": store_id},
        )
    ).mappings().first()
    if not row:
        raise HTTPException(404, "Proposta não encontrada")

    sub = dict(row)
    shop_order_id: str | None = sub.get("shop_order_id")

    if status == "accepted" and not shop_order_id:
        shop_order_id = await _create_buylist_escrow_order(
            session,
            store=store,
            submission=sub,
            buylist_title=str(existing.get("buylist_title") or "Coleção BuyList"),
        )
        await session.execute(
            text(
                """
                UPDATE tcg_judge.buylist_submissions
                SET shop_order_id = :oid, updated_at = NOW()
                WHERE id = :id
                """
            ),
            {"oid": shop_order_id, "id": submission_id},
        )
        sub["shop_order_id"] = shop_order_id

        from app.marketplace.shop_notifications import notify_shop_event

        await notify_shop_event(
            session,
            "buylist:accepted",
            buyer_id=sub["seller_user_id"],
            body="Sua proposta foi aceita. Envie as cartas e aguarde o pagamento via Compra Protegida.",
            data={
                "submission_id": submission_id,
                "store_id": store_id,
                "shop_order_id": shop_order_id,
            },
        )
        await notify_shop_event(
            session,
            "buylist:payment_required",
            buyer_id=str(store["owner_id"]),
            body="Proposta aceita. Pague via PIX para liberar o escrow da compra de coleção.",
            data={
                "submission_id": submission_id,
                "store_id": store_id,
                "shop_order_id": shop_order_id,
                "pay_pix_path": f"/vendedor/painel/buylist?pay={submission_id}",
            },
        )
    elif status == "rejected":
        from app.marketplace.shop_notifications import notify_shop_event

        await notify_shop_event(
            session,
            "buylist:rejected",
            buyer_id=sub["seller_user_id"],
            body="A loja não aceitou sua proposta de venda de coleção.",
            data={"submission_id": submission_id, "store_id": store_id},
        )

    await session.commit()
    sub["shop_order_id"] = shop_order_id
    return sub


async def _create_buylist_escrow_order(
    session: AsyncSession,
    *,
    store: dict[str, Any],
    submission: dict[str, Any],
    buylist_title: str,
) -> str:
    from app.marketplace import shop_escrow

    store_id = str(store["id"])
    store_owner = str(store["owner_id"])
    seller_user_id = str(submission["seller_user_id"])
    buylist_id = str(submission["buylist_id"])
    amount_cents = int(submission.get("total_offer_cents") or 0)
    if amount_cents <= 0:
        raise HTTPException(400, "Valor da proposta inválido")

    fees = shop_escrow.calculate_escrow_fees(amount_cents)
    total_cents = fees["total_cents"]
    platform_fee = fees["escrow_fee_cents"]
    store_receives = fees["seller_release_cents"]

    order_row = (
        await session.execute(
            text(
                """
                INSERT INTO tcg_judge.shop_orders (
                  buyer_id, store_id, status, total_cents,
                  platform_fee_cents, store_receives_cents,
                  payment_method, use_escrow,
                  shipping_address
                ) VALUES (
                  :buyer, :store, 'pending', :total,
                  :fee, :store_recv, 'escrow_pix', true,
                  CAST(:meta AS jsonb)
                )
                RETURNING id
                """
            ),
            {
                "buyer": store_owner,
                "store": store_id,
                "total": total_cents,
                "fee": platform_fee,
                "store_recv": store_receives,
                "meta": json.dumps(
                    {
                        "kind": "buylist",
                        "buylist_id": buylist_id,
                        "submission_id": str(submission["id"]),
                        "seller_user_id": seller_user_id,
                        "title": buylist_title,
                    }
                ),
            },
        )
    ).mappings().first()
    if not order_row:
        raise HTTPException(500, "Falha ao criar pedido BuyList")

    order_id = str(order_row["id"])
    items = (
        await session.execute(
            text("SELECT * FROM tcg_judge.buylist_items WHERE buylist_id = :bid"),
            {"bid": buylist_id},
        )
    ).mappings().all()

    for item in items:
        qty = int(item["quantity"])
        unit = int(item["offer_cents"])
        await session.execute(
            text(
                """
                INSERT INTO tcg_judge.shop_order_items (
                  order_id, product_id, product_name, quantity,
                  unit_price_cents, total_price_cents
                ) VALUES (
                  :oid, NULL, :name, :qty, :unit, :total
                )
                """
            ),
            {
                "oid": order_id,
                "name": f"{item['card_name']} (BuyList)",
                "qty": qty,
                "unit": unit,
                "total": unit * qty,
            },
        )

    await shop_escrow.create_escrow_for_order(
        session,
        shop_order_id=order_id,
        buyer_id=store_owner,
        seller_id=seller_user_id,
        amount_cents=amount_cents,
        payment_method="pix",
    )
    return order_id


async def create_buylist_pix_payment(
    session: AsyncSession,
    submission_id: str,
    store_id: str,
    owner_id: str,
) -> dict[str, Any]:
    """Gera cobrança PIX da plataforma para o lojista pagar o escrow BuyList."""
    import uuid
    from datetime import UTC, datetime, timedelta

    from app.core.config import get_settings
    from app.marketplace.pix_gateway import get_pix_gateway
    from app.marketplace.shop_notifications import notify_shop_event
    from app.marketplace.shop_pix import PIX_EXPIRY_MINUTES, _build_copy_payload, _qr_base64

    store = await _assert_store_owner(session, store_id, owner_id)
    _require_buylist_plan(store)

    settings = get_settings()
    if not settings.platform_pix_key:
        raise HTTPException(503, "PIX da plataforma indisponível — configure PLATFORM_PIX_KEY")

    sub = (
        await session.execute(
            text(
                """
                SELECT bs.*, b.title AS buylist_title
                FROM tcg_judge.buylist_submissions bs
                JOIN tcg_judge.buylists b ON b.id = bs.buylist_id
                WHERE bs.id = :id AND bs.store_id = :sid AND bs.status = 'accepted'
                """
            ),
            {"id": submission_id, "sid": store_id},
        )
    ).mappings().first()
    if not sub:
        raise HTTPException(404, "Proposta aceita não encontrada")

    order_id = sub.get("shop_order_id")
    if not order_id:
        raise HTTPException(400, "Pedido escrow ainda não foi criado")

    order = (
        await session.execute(
            text(
                """
                SELECT id, buyer_id, status, total_cents, payment_method, pix_txid, use_escrow
                FROM tcg_judge.shop_orders
                WHERE id = :oid AND store_id = :sid
                """
            ),
            {"oid": str(order_id), "sid": store_id},
        )
    ).mappings().first()
    if not order:
        raise HTTPException(404, "Pedido não encontrado")
    if str(order["buyer_id"]) != owner_id:
        raise HTTPException(403, "Apenas o dono da loja pode pagar este pedido")
    if order["status"] not in {"pending", "processing"}:
        raise HTTPException(400, "Pedido já foi pago ou cancelado")

    existing_txid = order.get("pix_txid")
    if existing_txid:
        pix_row = (
            await session.execute(
                text(
                    """
                    SELECT txid, amount_cents, status, expires_at, payload, pix_key
                    FROM tcg_judge.pix_transactions
                    WHERE txid = :txid
                    """
                ),
                {"txid": str(existing_txid)},
            )
        ).mappings().first()
        if pix_row and pix_row["status"] == "pending":
            payload = {}
            raw = pix_row.get("payload")
            if raw:
                try:
                    payload = json.loads(raw) if isinstance(raw, str) else dict(raw)
                except (json.JSONDecodeError, TypeError):
                    payload = {}
            qr = payload.get("qr_code")
            return {
                "order_id": str(order_id),
                "submission_id": submission_id,
                "txid": pix_row["txid"],
                "amount_cents": int(pix_row["amount_cents"]),
                "copy_payload": payload.get("copy_payload") or "",
                "qr_code": qr,
                "expires_at": (
                    pix_row["expires_at"].isoformat()
                    if hasattr(pix_row["expires_at"], "isoformat")
                    else str(pix_row["expires_at"])
                ),
                "pix_key": pix_row.get("pix_key"),
                "payment_method": "escrow_buylist",
            }

    amount_cents = int(order["total_cents"])
    txid = f"BLST{uuid.uuid4().hex[:12].upper()}"
    expires_at = datetime.now(UTC) + timedelta(minutes=PIX_EXPIRY_MINUTES)
    gateway = get_pix_gateway(settings)
    title = str(sub.get("buylist_title") or "BuyList")[:40]

    gateway_result: dict[str, Any] = {}
    try:
        gateway_result = await gateway.create_charge(
            txid=txid,
            amount_cents=amount_cents,
            pix_key=str(settings.platform_pix_key),
            pix_key_type=settings.platform_pix_key_type,
            description=f"BuyList Escrow — {title}",
            expires_in_seconds=PIX_EXPIRY_MINUTES * 60,
        )
    except Exception:
        pass

    copy_payload = gateway_result.get("copy_payload") or _build_copy_payload(
        store_name=str(store.get("name") or "Judge TCG"),
        pix_key=str(settings.platform_pix_key),
        amount_cents=amount_cents,
        txid=txid,
    )
    qr_b64 = gateway_result.get("qr_code")
    if not qr_b64 and copy_payload:
        qr_raw = _qr_base64(copy_payload)
        if qr_raw:
            qr_b64 = f"data:image/png;base64,{qr_raw}"

    await session.execute(
        text(
            """
            INSERT INTO tcg_judge.pix_transactions (
              order_id, txid, pix_key, pix_key_type, amount_cents, status, expires_at, payload,
              gateway_provider, gateway_charge_id
            ) VALUES (
              :oid, :txid, :key, :key_type, :amt, 'pending', :exp, :payload,
              :provider, :charge_id
            )
            """
        ),
        {
            "oid": str(order_id),
            "txid": txid,
            "key": settings.platform_pix_key,
            "key_type": settings.platform_pix_key_type or "random",
            "amt": amount_cents,
            "exp": expires_at,
            "payload": json.dumps(
                {
                    "copy_payload": copy_payload,
                    "qr_code": qr_b64,
                    "kind": "escrow_buylist",
                    "submission_id": submission_id,
                    "store_id": store_id,
                }
            ),
            "provider": gateway_result.get("gateway_provider") or "manual",
            "charge_id": gateway_result.get("gateway_charge_id"),
        },
    )
    await session.execute(
        text(
            """
            UPDATE tcg_judge.shop_orders
            SET pix_txid = :txid, updated_at = NOW()
            WHERE id = :oid
            """
        ),
        {"txid": txid, "oid": str(order_id)},
    )

    await notify_shop_event(
        session,
        "buylist:pix_created",
        buyer_id=owner_id,
        body=f"PIX BuyList gerado — R$ {amount_cents / 100:.2f}",
        data={"submission_id": submission_id, "order_id": str(order_id), "txid": txid},
    )
    await session.commit()

    return {
        "order_id": str(order_id),
        "submission_id": submission_id,
        "txid": txid,
        "amount_cents": amount_cents,
        "copy_payload": copy_payload,
        "qr_code": qr_b64,
        "expires_at": expires_at.isoformat(),
        "pix_key": settings.platform_pix_key,
        "payment_method": "escrow_buylist",
    }
