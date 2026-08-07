"""Cupons de desconto por loja."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


def calculate_coupon_discount(coupon: dict[str, Any], order_total_cents: int) -> int:
    """Calcula desconto em centavos (função pura para testes e checkout)."""
    if coupon["type"] == "percentage":
        discount = int(order_total_cents * int(coupon["value_cents"]) / 100)
    else:
        discount = int(coupon["value_cents"])

    max_d = coupon.get("max_discount_cents")
    if max_d:
        discount = min(discount, int(max_d))
    return min(discount, order_total_cents)


async def create_coupon(
    session: AsyncSession,
    store_id: str,
    owner_id: str,
    *,
    code: str,
    coupon_type: str,
    value_cents: int,
    min_order_cents: int = 0,
    max_discount_cents: int | None = None,
    max_uses: int | None = None,
    expires_at: datetime | None = None,
    is_active: bool = True,
) -> dict[str, Any]:
    store = (
        await session.execute(
            text("SELECT id FROM tcg_judge.stores WHERE id = :id AND owner_id = :oid"),
            {"id": store_id, "oid": owner_id},
        )
    ).mappings().first()
    if not store:
        raise HTTPException(404, "Loja não encontrada")
    if coupon_type not in {"percentage", "fixed"}:
        raise HTTPException(400, "Tipo de cupom inválido")

    normalized = code.strip().upper()
    if len(normalized) < 3:
        raise HTTPException(400, "Código muito curto")

    row = (
        await session.execute(
            text(
                """
                INSERT INTO tcg_judge.shop_coupons
                  (store_id, code, type, value_cents, min_order_cents, max_discount_cents,
                   max_uses, expires_at, is_active)
                VALUES (:sid, :code, :type, :val, :min, :max_d, :max_u, :exp, :active)
                RETURNING *
                """
            ),
            {
                "sid": store_id,
                "code": normalized,
                "type": coupon_type,
                "val": value_cents,
                "min": min_order_cents,
                "max_d": max_discount_cents,
                "max_u": max_uses,
                "exp": expires_at,
                "active": is_active,
            },
        )
    ).mappings().first()
    await session.commit()
    return dict(row) if row else {}


async def list_coupons(session: AsyncSession, store_id: str, owner_id: str) -> list[dict[str, Any]]:
    store = (
        await session.execute(
            text("SELECT id FROM tcg_judge.stores WHERE id = :id AND owner_id = :oid"),
            {"id": store_id, "oid": owner_id},
        )
    ).mappings().first()
    if not store:
        raise HTTPException(404, "Loja não encontrada")

    rows = (
        await session.execute(
            text(
                """
                SELECT * FROM tcg_judge.shop_coupons
                WHERE store_id = :sid
                ORDER BY created_at DESC
                """
            ),
            {"sid": store_id},
        )
    ).mappings().all()
    return [dict(r) for r in rows]


async def deactivate_coupon(
    session: AsyncSession, store_id: str, owner_id: str, coupon_id: str
) -> dict[str, Any]:
    return await update_coupon(
        session,
        store_id,
        owner_id,
        coupon_id,
        is_active=False,
    )


async def update_coupon(
    session: AsyncSession,
    store_id: str,
    owner_id: str,
    coupon_id: str,
    *,
    coupon_type: str | None = None,
    value_cents: int | None = None,
    min_order_cents: int | None = None,
    max_discount_cents: int | None = None,
    max_uses: int | None = None,
    clear_max_uses: bool = False,
    expires_at: datetime | None = None,
    clear_expires_at: bool = False,
    is_active: bool | None = None,
) -> dict[str, Any]:
    store = (
        await session.execute(
            text("SELECT id FROM tcg_judge.stores WHERE id = :id AND owner_id = :oid"),
            {"id": store_id, "oid": owner_id},
        )
    ).mappings().first()
    if not store:
        raise HTTPException(404, "Loja não encontrada")

    if coupon_type is not None and coupon_type not in {"percentage", "fixed"}:
        raise HTTPException(400, "Tipo de cupom inválido")
    if value_cents is not None and value_cents <= 0:
        raise HTTPException(400, "Valor inválido")

    sets: list[str] = []
    params: dict[str, Any] = {"cid": coupon_id, "sid": store_id}
    if coupon_type is not None:
        sets.append("type = :type")
        params["type"] = coupon_type
    if value_cents is not None:
        sets.append("value_cents = :val")
        params["val"] = value_cents
    if min_order_cents is not None:
        sets.append("min_order_cents = :min_o")
        params["min_o"] = min_order_cents
    if max_discount_cents is not None:
        sets.append("max_discount_cents = :max_d")
        params["max_d"] = max_discount_cents
    if clear_max_uses:
        sets.append("max_uses = NULL")
    elif max_uses is not None:
        sets.append("max_uses = :max_u")
        params["max_u"] = max_uses
    if clear_expires_at:
        sets.append("expires_at = NULL")
    elif expires_at is not None:
        sets.append("expires_at = :exp")
        params["exp"] = expires_at
    if is_active is not None:
        sets.append("is_active = :active")
        params["active"] = is_active

    if not sets:
        raise HTTPException(400, "Nenhum campo para atualizar")

    row = (
        await session.execute(
            text(
                f"""
                UPDATE tcg_judge.shop_coupons
                SET {", ".join(sets)}
                WHERE id = :cid AND store_id = :sid
                RETURNING *
                """
            ),
            params,
        )
    ).mappings().first()
    if not row:
        raise HTTPException(404, "Cupom não encontrado")
    await session.commit()
    return dict(row)


async def validate_coupon(
    session: AsyncSession,
    store_id: str,
    code: str,
    order_total_cents: int,
) -> dict[str, Any]:
    normalized = code.strip().upper()
    coupon = (
        await session.execute(
            text(
                """
                SELECT * FROM tcg_judge.shop_coupons
                WHERE store_id = :sid AND UPPER(code) = :code AND is_active = TRUE
                """
            ),
            {"sid": store_id, "code": normalized},
        )
    ).mappings().first()
    if not coupon:
        raise HTTPException(404, "Cupom inválido")

    now = datetime.now(UTC)
    if coupon.get("expires_at"):
        exp = coupon["expires_at"]
        if isinstance(exp, datetime) and exp.replace(tzinfo=exp.tzinfo or UTC) < now:
            raise HTTPException(400, "Cupom expirado")
    if coupon.get("max_uses") and int(coupon["current_uses"]) >= int(coupon["max_uses"]):
        raise HTTPException(400, "Cupom esgotado")
    if order_total_cents < int(coupon.get("min_order_cents") or 0):
        raise HTTPException(400, "Valor mínimo do pedido não atingido")

    discount = calculate_coupon_discount(dict(coupon), order_total_cents)

    return {
        "coupon_id": str(coupon["id"]),
        "code": normalized,
        "discount_cents": discount,
        "final_total_cents": order_total_cents - discount,
    }


async def record_coupon_use(
    session: AsyncSession,
    *,
    coupon_id: str,
    order_id: str,
    user_id: str,
    discount_cents: int,
) -> None:
    inserted = (
        await session.execute(
            text(
                """
                INSERT INTO tcg_judge.shop_coupon_uses (coupon_id, order_id, user_id, discount_cents)
                VALUES (:cid, :oid, :uid, :disc)
                ON CONFLICT (coupon_id, order_id) DO NOTHING
                RETURNING id
                """
            ),
            {"cid": coupon_id, "oid": order_id, "uid": user_id, "disc": discount_cents},
        )
    ).mappings().first()
    if not inserted:
        return
    await session.execute(
        text(
            """
            UPDATE tcg_judge.shop_coupons
            SET current_uses = current_uses + 1
            WHERE id = :id
            """
        ),
        {"id": coupon_id},
    )
