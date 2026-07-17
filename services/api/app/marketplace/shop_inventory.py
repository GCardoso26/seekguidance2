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


def _parse_brl_to_cents(raw: str) -> int | None:
    text = (raw or "").strip().replace("R$", "").replace(" ", "")
    if not text:
        return None
    # Liga usa ponto decimal (0.30); BR às vezes vírgula
    if "," in text and "." in text:
        text = text.replace(".", "").replace(",", ".")
    elif "," in text:
        text = text.replace(",", ".")
    try:
        return int(round(float(text) * 100))
    except ValueError:
        return None


def _is_liga_lorcana_headers(fieldnames: list[str] | None) -> bool:
    if not fieldnames:
        return False
    joined = " | ".join(fieldnames).lower()
    return ("carta id" in joined or "carta_id" in joined) and (
        "nome da carta" in joined or "quantidade existente" in joined
    )


def _strip_csv_preamble(csv_text: str) -> str:
    """Remove instruções do export Liga antes da linha de cabeçalho."""
    lines = csv_text.splitlines()
    for i, line in enumerate(lines):
        stripped = line.lstrip("\ufeff").strip()
        if stripped.startswith('"Tipo"') or stripped.startswith("Tipo,"):
            return "\n".join(lines[i:])
    return csv_text


def _field(row: dict[str, str], *candidates: str) -> str:
    lower_map = {str(k).strip().lower(): (v or "") for k, v in row.items() if k is not None}
    for cand in candidates:
        if cand.lower() in lower_map:
            return lower_map[cand.lower()].strip()
    for key, val in lower_map.items():
        for cand in candidates:
            if cand.lower() in key:
                return val.strip()
    return ""


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


def _parse_liga_lorcana_row(row: dict[str, str], line_no: int) -> tuple[dict[str, Any] | None, str | None]:
    """Export Liga Magic / LigaLorcana → produto single JudgeTCG."""
    name_en = _field(row, "Nome da Carta EN", "nome da carta en")
    name_pt = _field(row, "Nome da Carta", "nome da carta")
    base_name = name_en or name_pt
    if not base_name:
        return None, None

    qty_delta = _field(row, "Quantidade Para Somar", "Quantidade Para Somar/Subtrair")
    qty_exist = _field(row, "Quantidade Existente")
    qty_raw = qty_delta or qty_exist
    if not qty_raw:
        return None, None
    try:
        stock = int(float(qty_raw))
    except ValueError:
        return None, f"Linha {line_no}: quantidade inválida ({qty_raw})"
    if stock <= 0:
        return None, None

    price_cents = _parse_brl_to_cents(_field(row, "Preço", "Preco", "price"))
    if price_cents is None or price_cents <= 0:
        return None, f"Linha {line_no} ({base_name}): preço inválido ou ausente"

    condition = _field(row, "Qualidade (M, NM, SP, MP, HP, D)", "Qualidade") or "NM"
    set_code = _field(row, "Edição Sigla", "Edicao Sigla")
    card_id = _field(row, "Carta ID")
    number = _field(row, "Número", "Numero").lstrip("=").strip('"')
    foil = _field(row, "Foil (0 ou 1)", "Foil") == "1"

    name = f"{base_name} ({condition})"
    if foil:
        name = f"{base_name} ★ ({condition})"

    sku_parts = [p for p in (set_code, card_id or number, condition, "F" if foil else None) if p]
    sku = "-".join(sku_parts)[:64] if sku_parts else None
    description = " · ".join(
        p for p in (set_code, f"#{number}" if number else None, "LigaLorcana import") if p
    )

    return {
        "name": name,
        "category": "single",
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
    *,
    dry_run: bool = False,
) -> dict[str, Any]:
    import csv
    import io

    from app.marketplace import shop_products

    await _assert_store_owner(session, store_id, owner_id)
    text_clean = csv_text.strip()
    if not text_clean:
        raise HTTPException(400, "CSV vazio")

    text_clean = _strip_csv_preamble(text_clean)
    reader = csv.DictReader(io.StringIO(text_clean))
    if not reader.fieldnames:
        raise HTTPException(400, "CSV sem cabeçalho (name,category,price_cents,stock,sku)")

    liga_mode = _is_liga_lorcana_headers(list(reader.fieldnames))
    parse_row = _parse_liga_lorcana_row if liga_mode else _parse_csv_row

    imported = 0
    skipped = 0
    errors: list[str] = []
    preview: list[dict[str, Any]] = []

    for line_no, row in enumerate(reader, start=2):
        parsed, err = parse_row(row, line_no)
        if err:
            errors.append(err)
            skipped += 1
            continue
        if not parsed:
            continue
        preview.append({**parsed, "line": line_no})
        if dry_run:
            imported += 1
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

    return {
        "imported": imported,
        "skipped": skipped,
        "errors": errors[:50],
        "dry_run": dry_run,
        "format": "liga_lorcana" if liga_mode else "judgetcg",
        "preview": preview[:50] if dry_run else [],
        "rollback_supported": False,
    }
