"""Checkout PIX direto — pagamento vai para o lojista, zero comissão."""

from __future__ import annotations

import base64
import io
import json
import uuid
from datetime import UTC, datetime, timedelta
from typing import Any

import structlog
from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.marketplace import shop_cart
from app.marketplace.shop_store import store_has_pix, store_has_stripe, store_is_sellable

logger = structlog.get_logger(__name__)

PIX_KEY_TYPES = frozenset({"cpf", "cnpj", "email", "phone", "random"})
PIX_EXPIRY_MINUTES = 30


def _format_brl(cents: int) -> str:
    return f"{cents / 100:.2f}".replace(".", ",")


def _build_copy_payload(*, store_name: str, pix_key: str, amount_cents: int, txid: str) -> str:
    return (
        f"Pagamento PIX — {store_name}\n"
        f"Chave: {pix_key}\n"
        f"Valor: R$ {_format_brl(amount_cents)}\n"
        f"Identificador: {txid}"
    )


def _qr_base64(payload: str) -> str | None:
    try:
        import qrcode

        img = qrcode.make(payload)
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        return base64.b64encode(buf.getvalue()).decode()
    except Exception as exc:
        logger.warning("pix_qr_generate_failed", error=str(exc))
        return None


async def update_payment_settings(
    session: AsyncSession,
    store_id: str,
    owner_id: str,
    *,
    pix_key_type: str | None = None,
    pix_key: str | None = None,
    payment_method_preference: str | None = None,
) -> dict[str, Any]:
    store = (
        await session.execute(
            text("SELECT * FROM tcg_judge.stores WHERE id = :id AND owner_id = :oid"),
            {"id": store_id, "oid": owner_id},
        )
    ).mappings().first()
    if not store:
        raise HTTPException(404, "Loja não encontrada")

    sets: list[str] = []
    params: dict[str, Any] = {"id": store_id, "oid": owner_id}

    if pix_key_type is not None:
        if pix_key_type not in PIX_KEY_TYPES:
            raise HTTPException(400, "Tipo de chave PIX inválido")
        sets.append("pix_key_type = :pix_type")
        params["pix_type"] = pix_key_type

    if pix_key is not None:
        key = pix_key.strip()
        if len(key) < 3:
            raise HTTPException(400, "Chave PIX inválida")
        sets.append("pix_key = :pix_key")
        params["pix_key"] = key

    if payment_method_preference is not None:
        if payment_method_preference not in {"pix", "stripe", "both"}:
            raise HTTPException(400, "Preferência de pagamento inválida")
        sets.append("payment_method_preference = :pref")
        params["pref"] = payment_method_preference

    if not sets:
        raise HTTPException(400, "Nada para atualizar")

    if pix_key is not None and pix_key.strip():
        sets.append("shop_enabled = true")

    row = (
        await session.execute(
            text(
                f"""
                UPDATE tcg_judge.stores
                SET {', '.join(sets)}, updated_at = NOW()
                WHERE id = :id AND owner_id = :oid
                RETURNING *
                """
            ),
            params,
        )
    ).mappings().first()
    await session.commit()
    return dict(row) if row else {}


async def get_checkout_methods(session: AsyncSession, user_id: str) -> dict[str, Any]:
    cart = await shop_cart.get_cart(session, user_id)
    items = list(cart.get("items") or [])
    if not items:
        raise HTTPException(400, "Carrinho vazio")

    stores: dict[str, dict[str, Any]] = {}
    total_cents = 0

    for item in items:
        product = (
            await session.execute(
                text(
                    """
                    SELECT p.price_cents, p.stock, p.name, p.store_id,
                           s.name AS store_name, s.pix_key, s.payment_method_preference,
                           s.stripe_account_id, s.stripe_onboarding_complete, s.shop_enabled
                    FROM tcg_judge.store_products p
                    JOIN tcg_judge.stores s ON s.id = p.store_id
                    WHERE p.id = :id AND p.is_active = true
                    """
                ),
                {"id": item["product_id"]},
            )
        ).mappings().first()
        if not product:
            raise HTTPException(400, f"Produto indisponível: {item.get('name')}")
        store = dict(product)
        if not store_is_sellable(store):
            raise HTTPException(400, f"Loja não configurou pagamentos: {store.get('store_name')}")

        qty = int(item.get("quantity", 0))
        if qty < 1 or qty > int(store["stock"]):
            raise HTTPException(400, f"Estoque insuficiente: {store['name']}")

        line = int(store["price_cents"]) * qty
        total_cents += line
        sid = str(store["store_id"])
        if sid not in stores:
            stores[sid] = {
                "store_id": sid,
                "store_name": store["store_name"],
                "pix_available": store_has_pix(store),
                "stripe_available": store_has_stripe(store),
                "payment_method_preference": store.get("payment_method_preference") or "pix",
            }

    pix_ok = all(s["pix_available"] for s in stores.values())
    stripe_ok = all(s["stripe_available"] for s in stores.values())

    default_method = "pix"
    if not pix_ok and stripe_ok:
        default_method = "stripe"
    elif pix_ok and not stripe_ok:
        default_method = "pix"

    return {
        "total_cents": total_cents,
        "stores": list(stores.values()),
        "methods": {
            "pix": pix_ok,
            "stripe": stripe_ok,
        },
        "default_method": default_method,
    }


async def create_pix_checkout(
    session: AsyncSession,
    user_id: str,
    *,
    shipping_address: dict[str, Any] | None = None,
) -> dict[str, Any]:
    methods = await get_checkout_methods(session, user_id)
    if not methods["methods"]["pix"]:
        raise HTTPException(400, "PIX indisponível para itens do carrinho. Configure PIX na loja ou use cartão.")

    cart = await shop_cart.get_cart(session, user_id)
    items = list(cart.get("items") or [])

    store_splits: dict[str, dict[str, Any]] = {}
    order_ids: list[str] = []
    pix_payloads: list[dict[str, Any]] = []

    for item in items:
        product = (
            await session.execute(
                text(
                    """
                    SELECT p.*, s.name AS store_name, s.pix_key, s.pix_key_type,
                           s.stripe_account_id, s.stripe_onboarding_complete, s.shop_enabled
                    FROM tcg_judge.store_products p
                    JOIN tcg_judge.stores s ON s.id = p.store_id
                    WHERE p.id = :id AND p.is_active = true
                    """
                ),
                {"id": item["product_id"]},
            )
        ).mappings().first()
        if not product or not store_is_sellable(dict(product)):
            raise HTTPException(400, "Produto ou loja indisponível")
        if not product.get("pix_key"):
            raise HTTPException(400, f"Loja sem PIX: {product.get('store_name')}")

        qty = int(item.get("quantity", 0))
        line_total = int(product["price_cents"]) * qty
        store_id = str(product["store_id"])

        if store_id not in store_splits:
            store_splits[store_id] = {
                "amount_cents": 0,
                "lines": [],
                "store_name": product["store_name"],
                "pix_key": product["pix_key"],
            }
        store_splits[store_id]["amount_cents"] += line_total
        store_splits[store_id]["lines"].append(
            {
                "product_id": str(product["id"]),
                "product_name": product["name"],
                "product_image": (product.get("images") or [None])[0],
                "quantity": qty,
                "unit_price_cents": int(product["price_cents"]),
                "total_price_cents": line_total,
            }
        )

    expires_at = datetime.now(UTC) + timedelta(minutes=PIX_EXPIRY_MINUTES)

    for store_id, split in store_splits.items():
        txid = f"JTCG{uuid.uuid4().hex[:12].upper()}"
        copy_payload = _build_copy_payload(
            store_name=str(split["store_name"]),
            pix_key=str(split["pix_key"]),
            amount_cents=split["amount_cents"],
            txid=txid,
        )
        qr_b64 = _qr_base64(copy_payload)

        order_row = (
            await session.execute(
                text(
                    """
                    INSERT INTO tcg_judge.shop_orders (
                      buyer_id, store_id, status, total_cents,
                      platform_fee_cents, store_receives_cents,
                      shipping_address, payment_method, pix_txid
                    ) VALUES (
                      :buyer, :store, 'pending', :total,
                      0, :total, :addr::jsonb, 'pix', :txid
                    )
                    RETURNING id
                    """
                ),
                {
                    "buyer": user_id,
                    "store": store_id,
                    "total": split["amount_cents"],
                    "addr": json.dumps(shipping_address) if shipping_address else None,
                    "txid": txid,
                },
            )
        ).mappings().first()
        order_id = str(order_row["id"]) if order_row else None
        if not order_id:
            continue

        order_ids.append(order_id)
        for line in split["lines"]:
            await session.execute(
                text(
                    """
                    INSERT INTO tcg_judge.shop_order_items (
                      order_id, product_id, product_name, product_image,
                      quantity, unit_price_cents, total_price_cents
                    ) VALUES (
                      :oid, :pid, :name, :img, :qty, :unit, :total
                    )
                    """
                ),
                {
                    "oid": order_id,
                    "pid": line["product_id"],
                    "name": line["product_name"],
                    "img": line.get("product_image"),
                    "qty": line["quantity"],
                    "unit": line["unit_price_cents"],
                    "total": line["total_price_cents"],
                },
            )

        await session.execute(
            text(
                """
                INSERT INTO tcg_judge.pix_transactions (
                  order_id, txid, pix_key, amount_cents, status, expires_at, payload
                ) VALUES (
                  :oid, :txid, :key, :amt, 'pending', :exp, :payload
                )
                """
            ),
            {
                "oid": order_id,
                "txid": txid,
                "key": split["pix_key"],
                "amt": split["amount_cents"],
                "exp": expires_at,
                "payload": copy_payload,
            },
        )

        pix_payloads.append(
            {
                "order_id": order_id,
                "store_id": store_id,
                "store_name": split["store_name"],
                "txid": txid,
                "pix_key": split["pix_key"],
                "amount_cents": split["amount_cents"],
                "copy_payload": copy_payload,
                "qr_code": f"data:image/png;base64,{qr_b64}" if qr_b64 else None,
                "expires_at": expires_at.isoformat(),
            }
        )

    await shop_cart.clear_cart(session, user_id)
    await session.commit()

    return {
        "payment_method": "pix",
        "total_cents": methods["total_cents"],
        "order_ids": order_ids,
        "pix": pix_payloads[0] if len(pix_payloads) == 1 else None,
        "pix_items": pix_payloads,
    }


async def confirm_pix_payment(session: AsyncSession, txid: str) -> dict[str, Any]:
    """Webhook ou confirmação manual — marca pedido PIX como pago."""
    pix_tx = (
        await session.execute(
            text("SELECT * FROM tcg_judge.pix_transactions WHERE txid = :txid"),
            {"txid": txid},
        )
    ).mappings().first()
    if not pix_tx:
        raise HTTPException(404, "Transação PIX não encontrada")
    if pix_tx["status"] == "paid":
        return {"status": "paid", "order_id": str(pix_tx["order_id"])}

    order_id = str(pix_tx["order_id"])
    await session.execute(
        text(
            """
            UPDATE tcg_judge.pix_transactions
            SET status = 'paid', paid_at = NOW()
            WHERE txid = :txid
            """
        ),
        {"txid": txid},
    )
    await session.execute(
        text(
            """
            UPDATE tcg_judge.shop_orders
            SET status = 'paid', paid_at = NOW(), updated_at = NOW()
            WHERE id = :id AND status = 'pending'
            """
        ),
        {"id": order_id},
    )

    items = (
        await session.execute(
            text("SELECT product_id, quantity FROM tcg_judge.shop_order_items WHERE order_id = :oid"),
            {"oid": order_id},
        )
    ).mappings().all()
    for item in items:
        await session.execute(
            text(
                """
                UPDATE tcg_judge.store_products
                SET stock = GREATEST(0, stock - :qty), updated_at = NOW()
                WHERE id = :pid
                """
            ),
            {"pid": str(item["product_id"]), "qty": int(item["quantity"])},
        )

    await session.commit()
    return {"status": "paid", "order_id": order_id}
