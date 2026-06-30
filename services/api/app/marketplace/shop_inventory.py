"""Dashboard de estoque — produtos físicos + listagens de cartas."""

from __future__ import annotations

from typing import Any

from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.marketplace.shop_products import PRODUCT_CATEGORIES


async def _assert_store_owner(session: AsyncSession, store_id: str, owner_id: str) -> None:
    row = (
        await session.execute(
            text("SELECT id FROM tcg_judge.stores WHERE id = :id AND owner_id = :oid"),
            {"id": store_id, "oid": owner_id},
        )
    ).mappings().first()
    if not row:
        raise HTTPException(404, "Loja não encontrada")


async def inventory_summary(session: AsyncSession, store_id: str, owner_id: str) -> dict[str, Any]:
    await _assert_store_owner(session, store_id, owner_id)

    products = (
        await session.execute(
            text(
                """
                SELECT
                  COUNT(*) AS total_products,
                  COUNT(*) FILTER (WHERE stock <= 0) AS out_of_stock,
                  COUNT(*) FILTER (WHERE stock > 0 AND stock <= 3) AS low_stock,
                  COALESCE(SUM(stock * price_cents), 0) AS inventory_value_cents
                FROM tcg_judge.store_products
                WHERE store_id = :sid AND is_active
                """
            ),
            {"sid": store_id},
        )
    ).mappings().first()

    listings = (
        await session.execute(
            text(
                """
                SELECT
                  COUNT(*) AS active_listings,
                  COALESCE(SUM(quantity), 0) AS total_cards,
                  COALESCE(SUM(price_cents * quantity), 0) AS listings_value_cents
                FROM tcg_judge.card_listings
                WHERE seller_id = :oid AND status = 'active'
                """
            ),
            {"oid": owner_id},
        )
    ).mappings().first()

    low_rows = (
        await session.execute(
            text(
                """
                SELECT id, name, stock, price_cents, sku
                FROM tcg_judge.store_products
                WHERE store_id = :sid AND is_active AND stock <= 3
                ORDER BY stock ASC, name
                LIMIT 20
                """
            ),
            {"sid": store_id},
        )
    ).mappings().all()

    return {
        "products": dict(products) if products else {},
        "listings": dict(listings) if listings else {},
        "low_stock_products": [dict(r) for r in low_rows],
    }


def _parse_csv_row(row: dict[str, str], line_no: int) -> tuple[dict[str, Any] | None, str | None]:
    name = (row.get("name") or row.get("nome") or "").strip()
    if not name:
        return None, None
    category = (row.get("category") or row.get("categoria") or "accessory").strip().lower()
    if category not in PRODUCT_CATEGORIES:
        return None, f"Linha {line_no}: categoria inválida ({category})"
    try:
        price_cents = int(row.get("price_cents") or row.get("preco_centavos") or row.get("price") or "0")
        stock = int(row.get("stock") or row.get("estoque") or "0")
    except ValueError:
        return None, f"Linha {line_no}: preço ou estoque inválido"
    if price_cents <= 0:
        return None, f"Linha {line_no}: preço deve ser > 0"
    if stock < 0:
        return None, f"Linha {line_no}: estoque não pode ser negativo"
    sku = (row.get("sku") or "").strip() or None
    description = (row.get("description") or row.get("descricao") or "").strip() or None
    return {
        "name": name,
        "category": category,
        "price_cents": price_cents,
        "stock": stock,
        "sku": sku,
        "description": description,
    }, None


async def import_products_csv(
    session: AsyncSession,
    store_id: str,
    owner_id: str,
    csv_text: str,
) -> dict[str, Any]:
    import csv
    import io

    from app.marketplace import shop_products

    await _assert_store_owner(session, store_id, owner_id)
    text_clean = csv_text.strip()
    if not text_clean:
        raise HTTPException(400, "CSV vazio")

    reader = csv.DictReader(io.StringIO(text_clean))
    if not reader.fieldnames:
        raise HTTPException(400, "CSV sem cabeçalho (name,category,price_cents,stock,sku)")

    imported = 0
    skipped = 0
    errors: list[str] = []

    for line_no, row in enumerate(reader, start=2):
        parsed, err = _parse_csv_row(row, line_no)
        if err:
            errors.append(err)
            skipped += 1
            continue
        if not parsed:
            continue
        try:
            await shop_products.create_product(
                session,
                store_id,
                owner_id,
                name=parsed["name"],
                description=parsed["description"],
                tcg_id=None,
                category=parsed["category"],
                price_cents=parsed["price_cents"],
                stock=parsed["stock"],
                sku=parsed["sku"],
            )
            imported += 1
        except HTTPException as exc:
            detail = exc.detail if isinstance(exc.detail, str) else str(exc.detail)
            errors.append(f"Linha {line_no} ({parsed['name']}): {detail}")
            skipped += 1

    return {"imported": imported, "skipped": skipped, "errors": errors[:50]}
