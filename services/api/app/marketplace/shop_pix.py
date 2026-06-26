"""Checkout PIX direto — pagamento vai para o lojista, zero comissão."""

from __future__ import annotations

import base64
import hmac
import io
import json
import uuid
from datetime import UTC, datetime, timedelta
from typing import Any

import structlog
from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings, get_settings
from app.marketplace import shop_cart
from app.marketplace.pix_gateway import get_pix_gateway, parse_json_body
from app.marketplace.shop_notifications import notify_shop_event
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
                    SELECT p.price_cents, p.stock, COALESCE(p.reserved_stock, 0) AS reserved_stock,
                           p.name, p.store_id,
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
        available = int(store["stock"]) - int(store.get("reserved_stock") or 0)
        if qty < 1 or qty > available:
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
            "escrow": len(stores) == 1,
        },
        "escrow_fee_cents": round(total_cents * 0.03) if len(stores) == 1 else 0,
        "default_method": default_method,
    }


async def create_pix_checkout(
    session: AsyncSession,
    user_id: str,
    *,
    shipping_address: dict[str, Any] | None = None,
    coupon_code: str | None = None,
    store_id: str | None = None,
    checkout_session_id: str | None = None,
    use_escrow: bool = False,
) -> dict[str, Any]:
    from app.kyc.player_account import require_active_account
    from app.marketplace import checkout_atomic
    from app.marketplace import shop_escrow
    from app.marketplace.payments_gate import require_live_payments

    settings = get_settings()

    await require_active_account(session, user_id)

    if use_escrow:
        require_live_payments(settings)

    if checkout_session_id:
        checkout_data = await checkout_atomic.get_active_session(session, checkout_session_id, user_id)
        session_id = checkout_session_id
    else:
        checkout_data = await checkout_atomic.initiate_checkout(session, user_id)
        session_id = checkout_data["session_id"]

    methods = await get_checkout_methods(session, user_id)
    if not methods["methods"]["pix"]:
        raise HTTPException(400, "PIX indisponível para itens do carrinho. Configure PIX na loja ou use cartão.")
    if use_escrow and not methods["methods"].get("escrow"):
        raise HTTPException(400, "Compra protegida disponível apenas para pedidos de uma loja")

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
                           s.owner_id AS store_owner_id,
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
        if not use_escrow and not product.get("pix_key"):
            raise HTTPException(400, f"Loja sem PIX: {product.get('store_name')}")

        qty = int(item.get("quantity", 0))
        line_total = int(product["price_cents"]) * qty
        store_id = str(product["store_id"])

        if store_id not in store_splits:
            store_splits[store_id] = {
                "amount_cents": 0,
                "lines": [],
                "store_name": product["store_name"],
                "pix_key": str(settings.platform_pix_key) if use_escrow else product["pix_key"],
                "store_owner_id": str(product["store_owner_id"]),
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
    settings = get_settings()
    gateway = get_pix_gateway(settings)
    expiry_seconds = PIX_EXPIRY_MINUTES * 60

    coupon_store_id = store_id
    if coupon_code:
        normalized_code = coupon_code.strip().upper()
        if not coupon_store_id:
            if len(store_splits) != 1:
                raise HTTPException(400, "Informe a loja para aplicar o cupom")
            coupon_store_id = next(iter(store_splits))
        elif coupon_store_id not in store_splits:
            raise HTTPException(400, "Cupom não se aplica aos itens do carrinho")
    else:
        normalized_code = None

    total_discount_cents = 0
    total_charged_cents = 0

    for store_id, split in store_splits.items():
        subtotal_cents = int(split["amount_cents"])
        discount_cents = 0
        coupon_id: str | None = None
        applied_code: str | None = None

        if normalized_code and coupon_store_id == store_id:
            from app.marketplace import shop_coupons

            coupon_result = await shop_coupons.validate_coupon(
                session, store_id, normalized_code, subtotal_cents
            )
            discount_cents = int(coupon_result["discount_cents"])
            coupon_id = str(coupon_result["coupon_id"])
            applied_code = str(coupon_result["code"])

        product_amount_cents = subtotal_cents - discount_cents
        escrow_fee_cents = 0
        if use_escrow:
            escrow_fee_cents = shop_escrow.calculate_escrow_fees(product_amount_cents)["escrow_fee_cents"]
        final_cents = product_amount_cents + escrow_fee_cents
        total_discount_cents += discount_cents
        total_charged_cents += final_cents

        payment_method = "escrow_pix" if use_escrow else "pix"
        charge_label = "Compra Protegida" if use_escrow else f"Pedido {split['store_name'][:40]}"

        txid = f"JTCG{uuid.uuid4().hex[:12].upper()}"
        gateway_result: dict[str, Any] = {}
        try:
            gateway_result = await gateway.create_charge(
                txid=txid,
                amount_cents=final_cents,
                pix_key=str(split["pix_key"]),
                pix_key_type=settings.platform_pix_key_type if use_escrow else None,
                description=charge_label[:60],
                expires_in_seconds=expiry_seconds,
            )
        except Exception as exc:
            logger.warning("pix_gateway_charge_failed", error=str(exc), txid=txid)

        copy_payload = gateway_result.get("copy_payload") or _build_copy_payload(
            store_name=str(split["store_name"]),
            pix_key=str(split["pix_key"]),
            amount_cents=final_cents,
            txid=txid,
        )
        qr_b64 = gateway_result.get("qr_code")
        if not qr_b64 and copy_payload:
            qr_b64 = _qr_base64(copy_payload)
            if qr_b64:
                qr_b64 = f"data:image/png;base64,{qr_b64}"

        seller_release = product_amount_cents - escrow_fee_cents if use_escrow else product_amount_cents

        order_row = (
            await session.execute(
                text(
                    """
                    INSERT INTO tcg_judge.shop_orders (
                      buyer_id, store_id, status, total_cents,
                      platform_fee_cents, store_receives_cents,
                      shipping_address, payment_method, pix_txid,
                      discount_cents, coupon_id, coupon_code, subtotal_cents,
                      use_escrow
                    ) VALUES (
                      :buyer, :store, 'pending', :total,
                      :fee, :store_recv, :addr::jsonb, :pm, :txid,
                      :disc, :cid, :ccode, :subtotal,
                      :use_escrow
                    )
                    RETURNING id
                    """
                ),
                {
                    "buyer": user_id,
                    "store": store_id,
                    "total": final_cents,
                    "fee": escrow_fee_cents,
                    "store_recv": seller_release,
                    "addr": json.dumps(shipping_address) if shipping_address else None,
                    "pm": payment_method,
                    "txid": txid,
                    "disc": discount_cents,
                    "cid": coupon_id,
                    "ccode": applied_code,
                    "subtotal": subtotal_cents,
                    "use_escrow": use_escrow,
                },
            )
        ).mappings().first()
        order_id = str(order_row["id"]) if order_row else None
        if not order_id:
            continue

        if use_escrow:
            await shop_escrow.create_escrow_for_order(
                session,
                shop_order_id=order_id,
                buyer_id=user_id,
                seller_id=str(split["store_owner_id"]),
                amount_cents=product_amount_cents,
                payment_method="pix",
            )

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

        if coupon_id and discount_cents > 0:
            from app.marketplace import shop_coupons

            await shop_coupons.record_coupon_use(
                session,
                coupon_id=coupon_id,
                order_id=order_id,
                user_id=user_id,
                discount_cents=discount_cents,
            )

        await session.execute(
            text(
                """
                INSERT INTO tcg_judge.pix_transactions (
                  order_id, txid, pix_key, amount_cents, status, expires_at, payload,
                  gateway_provider, gateway_charge_id
                ) VALUES (
                  :oid, :txid, :key, :amt, 'pending', :exp, :payload,
                  :provider, :charge_id
                )
                """
            ),
            {
                "oid": order_id,
                "txid": txid,
                "key": split["pix_key"],
                "amt": final_cents,
                "exp": expires_at,
                "payload": json.dumps(
                    {
                        "copy_payload": copy_payload,
                        "checkout_session_id": session_id,
                        "use_escrow": use_escrow,
                    }
                ),
                "provider": gateway_result.get("gateway_provider") or "manual",
                "charge_id": gateway_result.get("gateway_charge_id"),
            },
        )

        await notify_shop_event(
            session,
            "shop:order_created",
            order_id=order_id,
            body=f"Novo pedido PIX — R$ {_format_brl(final_cents)}",
        )

        pix_payloads.append(
            {
                "order_id": order_id,
                "store_id": store_id,
                "store_name": split["store_name"],
                "txid": txid,
                "pix_key": split["pix_key"],
                "subtotal_cents": subtotal_cents,
                "discount_cents": discount_cents,
                "coupon_code": applied_code,
                "amount_cents": final_cents,
                "escrow_fee_cents": escrow_fee_cents if use_escrow else 0,
                "use_escrow": use_escrow,
                "copy_payload": copy_payload,
                "qr_code": qr_b64 if isinstance(qr_b64, str) and qr_b64.startswith("data:") else (
                    f"data:image/png;base64,{qr_b64}" if qr_b64 else None
                ),
                "expires_at": expires_at.isoformat(),
                "gateway_provider": gateway_result.get("gateway_provider") or "manual",
            }
        )

    await shop_cart.clear_cart(session, user_id)
    await session.commit()

    return {
        "payment_method": "pix",
        "total_cents": total_charged_cents,
        "original_total_cents": methods["total_cents"],
        "discount_cents": total_discount_cents,
        "order_ids": order_ids,
        "checkout_session_id": session_id,
        "expires_at": checkout_data.get("expires_at"),
        "pix": pix_payloads[0] if len(pix_payloads) == 1 else None,
        "pix_items": pix_payloads,
    }


async def confirm_pix_payment(
    session: AsyncSession,
    txid: str,
    *,
    webhook_payload: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Webhook ou confirmação manual — marca pedido PIX como pago."""
    pix_tx = (
        await session.execute(
            text("SELECT * FROM tcg_judge.pix_transactions WHERE txid = :txid"),
            {"txid": txid},
        )
    ).mappings().first()
    if not pix_tx:
        raise HTTPException(404, "Transação PIX não encontrada")

    if pix_tx.get("gateway_provider") == "platform_pro":
        from app.stores.subscriptions import confirm_pro_pix_payment

        return await confirm_pro_pix_payment(session, txid)

    if pix_tx["status"] == "paid":
        return {"status": "paid", "order_id": str(pix_tx["order_id"])}
    if pix_tx["status"] == "expired":
        raise HTTPException(410, "Transação PIX expirada")

    order_id = str(pix_tx["order_id"])
    payload_json = json.dumps(webhook_payload) if webhook_payload else None

    checkout_session_id: str | None = None
    raw_payload = pix_tx.get("payload")
    if raw_payload:
        try:
            parsed = json.loads(raw_payload) if isinstance(raw_payload, str) else raw_payload
            if isinstance(parsed, dict):
                checkout_session_id = parsed.get("checkout_session_id")
        except (json.JSONDecodeError, TypeError):
            pass

    stock_finalized = False
    if checkout_session_id:
        from app.marketplace import checkout_atomic

        try:
            await checkout_atomic.finalize_checkout(
                session,
                checkout_session_id,
                payment_method="pix",
            )
            stock_finalized = True
        except Exception as exc:
            logger.error("pix_checkout_finalize_failed", session_id=checkout_session_id, error=str(exc))

    await session.execute(
        text(
            """
            UPDATE tcg_judge.pix_transactions
            SET status = 'paid', paid_at = NOW(),
                webhook_payload = COALESCE(CAST(:payload AS jsonb), webhook_payload)
            WHERE txid = :txid
            """
        ),
        {"txid": txid, "payload": payload_json},
    )

    order_row = (
        await session.execute(
            text("SELECT use_escrow, payment_method FROM tcg_judge.shop_orders WHERE id = :id"),
            {"id": order_id},
        )
    ).mappings().first()
    is_escrow = bool(
        order_row
        and (
            order_row.get("use_escrow")
            or str(order_row.get("payment_method", "")).startswith("escrow_")
        )
    )

    history_status = "processing" if is_escrow else "paid"
    status_note = "Pagamento PIX em custódia (Compra Protegida)" if is_escrow else "Pagamento PIX confirmado"

    if is_escrow:
        from app.marketplace import shop_escrow

        await shop_escrow.on_payment_received(session, order_id, pix_txid=txid)
    else:
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

    if not stock_finalized and not is_escrow:
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

    await session.execute(
        text(
            """
            INSERT INTO tcg_judge.shop_order_status_history (order_id, status, note)
            VALUES (:oid, :status, :note)
            """
        ),
        {"oid": order_id, "status": history_status, "note": status_note},
    )

    await notify_shop_event(
        session,
        "shop:pix_paid",
        order_id=order_id,
        body=(
            "Pagamento recebido em custódia. O lojista enviará em até 48h."
            if is_escrow
            else "Pagamento PIX confirmado. O lojista preparará o envio."
        ),
    )

    try:
        from app.gamification.xp import award_xp_for_paid_order

        await award_xp_for_paid_order(session, order_id)
    except Exception as exc:
        import structlog

        structlog.get_logger().warning("liga_pass_xp_failed", order_id=order_id, error=str(exc))

    await session.commit()
    return {"status": "paid", "order_id": order_id}


async def handle_pix_gateway_webhook(
    session: AsyncSession,
    settings: Settings,
    raw_body: bytes,
    headers: dict[str, str],
) -> dict[str, Any]:
    """Processa webhook do gateway PIX (OpenPix/Asaas) ou confirmação interna."""
    gateway = get_pix_gateway(settings)
    payload = parse_json_body(raw_body)

    internal_secret = (settings.pix_webhook_internal_secret or "").strip()
    provided = headers.get("x-pix-webhook-secret") or headers.get("X-Pix-Webhook-Secret") or ""
    if internal_secret and hmac.compare_digest(provided, internal_secret):
        txid = payload.get("txid")
        if not txid:
            raise HTTPException(400, "txid obrigatório")
        return await confirm_pix_payment(session, str(txid), webhook_payload=payload)

    if not gateway.verify_webhook(raw_body, headers):
        raise HTTPException(401, "Assinatura de webhook inválida")

    txid = gateway.parse_webhook(payload)
    if not txid:
        return {"status": "ignored", "reason": "evento não é confirmação de pagamento"}

    return await confirm_pix_payment(session, txid, webhook_payload=payload)


async def get_pix_status(session: AsyncSession, txid: str) -> dict[str, Any]:
    row = (
        await session.execute(
            text(
                """
                SELECT pt.status, pt.order_id, pt.expires_at, pt.paid_at, o.status AS order_status
                FROM tcg_judge.pix_transactions pt
                LEFT JOIN tcg_judge.shop_orders o ON o.id = pt.order_id
                WHERE pt.txid = :txid
                """
            ),
            {"txid": txid},
        )
    ).mappings().first()
    if not row:
        raise HTTPException(404, "Transação não encontrada")
    return {
        "txid": txid,
        "status": row["status"],
        "order_id": str(row["order_id"]) if row.get("order_id") else None,
        "order_status": row.get("order_status"),
        "expires_at": row.get("expires_at"),
        "paid_at": row.get("paid_at"),
    }


async def expire_pending_pix(session: AsyncSession) -> int:
    """Marca transações PIX expiradas (cron)."""
    result = await session.execute(
        text(
            """
            UPDATE tcg_judge.pix_transactions
            SET status = 'expired'
            WHERE status = 'pending' AND expires_at < NOW()
            RETURNING id
            """
        )
    )
    rows = result.mappings().all()
    await session.commit()
    return len(rows)


async def get_pix_webhook_status(session: AsyncSession, store_id: str, owner_id: str) -> dict[str, Any]:
    store = (
        await session.execute(
            text("SELECT id FROM tcg_judge.stores WHERE id = :id AND owner_id = :oid"),
            {"id": store_id, "oid": owner_id},
        )
    ).mappings().first()
    if not store:
        raise HTTPException(404, "Loja não encontrada")

    settings = get_settings()
    provider = "openpix" if settings.openpix_api_key else "asaas" if settings.asaas_api_key else "manual"
    return {
        "gateway_provider": provider,
        "automatic_confirmation": provider != "manual",
        "webhook_url": "/runtime/judge/marketplace/shop/pix/webhook",
        "manual_fallback": True,
    }
