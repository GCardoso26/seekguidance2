"""Vendas de decklists no marketplace."""

from __future__ import annotations

from typing import Any

from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.marketplace.decklists import PLATFORM_FEE_PERCENT, get_listing


async def purchase_decklist(
    session: AsyncSession,
    listing_id: str,
    buyer_id: str,
) -> dict[str, Any]:
    listing = await get_listing(session, listing_id)
    if not listing or listing.get("status") != "active":
        raise HTTPException(404, "Decklist não disponível")
    if listing["seller_id"] == buyer_id:
        raise HTTPException(400, "Não pode comprar a própria decklist")

    price = int(listing["price_cents"])
    fee = int(price * PLATFORM_FEE_PERCENT / 100)
    seller_receives = price - fee

    existing = (
        await session.execute(
            text(
                "SELECT id FROM tcg_judge.decklist_sales WHERE decklist_id = :did AND buyer_id = :bid"
            ),
            {"did": listing_id, "bid": buyer_id},
        )
    ).mappings().first()
    if existing:
        sale = (
            await session.execute(
                text("SELECT * FROM tcg_judge.decklist_sales WHERE id = :id"),
                {"id": existing["id"]},
            )
        ).mappings().first()
        return {"sale": dict(sale), "decklist": listing["decklist_data"], "alreadyOwned": True}

    row = (
        await session.execute(
            text(
                """
                INSERT INTO tcg_judge.decklist_sales (
                  decklist_id, buyer_id, price_cents, platform_fee_cents, seller_receives_cents
                ) VALUES (:did, :bid, :price, :fee, :seller)
                RETURNING *
                """
            ),
            {
                "did": listing_id,
                "bid": buyer_id,
                "price": price,
                "fee": fee,
                "seller": seller_receives,
            },
        )
    ).mappings().first()

    await session.execute(
        text(
            """
            UPDATE tcg_judge.marketplace_decklists SET
              sales_count = sales_count + 1, updated_at = NOW()
            WHERE id = :id
            """
        ),
        {"id": listing_id},
    )
    await session.commit()
    return {"sale": dict(row) if row else {}, "decklist": listing["decklist_data"], "alreadyOwned": False}
