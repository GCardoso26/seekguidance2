"""Dashboard de estoque — produtos físicos + listagens de cartas."""

from __future__ import annotations

import re
from typing import Any

from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.catalog.image_utils import resolve_card_image
from app.marketplace.shop_products import PRODUCT_CATEGORIES
from app.tcg_adapters.sync_common import normalize_name

# LigaLorcana "Edição Sigla" → card_catalog.set_code (LORCANA)
LIGA_LORCANA_SET_MAP: dict[str, str] = {
    "LOR1": "TFC",
    "LOR2": "ROF",
    "LOR3": "INK",
    "LOR4": "URS",
    "LOR5": "SSK",
    "LOR6": "AZS",
    "LOR7": "ARI",
    "LOR8": "ROJ",
    "LOR9": "FAB",
    "LOR10": "WHI",
    "LOR11": "WIN",
    "LOR12": "WUN",
}


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


def _normalize_card_number(raw: str) -> str:
    text = (raw or "").lstrip("=").strip().strip('"').strip()
    text = re.sub(r"^0+(?=\d)", "", text) or text
    return text


def _catalog_set_from_liga(liga_set: str) -> str | None:
    code = (liga_set or "").strip().upper()
    if not code:
        return None
    if code in LIGA_LORCANA_SET_MAP:
        return LIGA_LORCANA_SET_MAP[code]
    # Já no formato do catálogo (TFC, SSK, …)
    if code in LIGA_LORCANA_SET_MAP.values():
        return code
    if len(code) <= 5 and code.isalpha():
        return code
    return None


def rewrite_liga_set_codes(text: str) -> str:
    """Troca LOR12…LOR1 pelas siglas do catálogo (TFC, ROF, …). Ordem: códigos longos primeiro."""
    if not text:
        return text
    out = text
    for liga in sorted(LIGA_LORCANA_SET_MAP.keys(), key=len, reverse=True):
        catalog = LIGA_LORCANA_SET_MAP[liga]
        out = re.sub(rf"\b{re.escape(liga)}\b", catalog, out, flags=re.IGNORECASE)
    return out


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
    liga_set = (_field(row, "Edição Sigla", "Edicao Sigla") or "").strip().upper()
    catalog_set = _catalog_set_from_liga(liga_set) or liga_set
    card_id = _field(row, "Carta ID")
    number = _normalize_card_number(_field(row, "Número", "Numero"))
    foil = _field(row, "Foil (0 ou 1)", "Foil") == "1"

    # Nome exibe a sigla do catálogo (TFC), não LOR1 da Liga.
    # Ex.: "Ariel - Spectacular Singer - TFC (NM)"
    if catalog_set:
        name = f"{base_name} - {catalog_set}"
    else:
        name = base_name
    if foil:
        name = f"{name} ★"
    name = f"{name} ({condition})"

    # Preferir número de colecionador no SKU (bate com catálogo); Carta ID da Liga é interno.
    sku_parts = [p for p in (catalog_set, number or card_id, condition, "F" if foil else None) if p]
    sku = "-".join(sku_parts)[:64] if sku_parts else None
    description = " · ".join(
        p for p in (catalog_set, f"#{number}" if number else None, "LigaLorcana import") if p
    )

    return {
        "name": name,
        "base_name": base_name,
        "category": "single",
        "price_cents": price_cents,
        "stock": stock,
        "sku": sku,
        "description": description,
        "liga_set": liga_set,
        "catalog_set": catalog_set,
        "card_number": number,
        "foil": foil,
        "condition": condition,
    }, None


def _image_list_from_catalog(card: dict[str, Any]) -> list[str]:
    uris = resolve_card_image(card)
    url = (uris.get("normal") or card.get("image_url") or "").strip()
    return [url] if url else []


async def _load_lorcana_catalog_index(
    session: AsyncSession,
) -> tuple[dict[tuple[str, str], dict[str, Any]], dict[tuple[str, str], dict[str, Any]]]:
    rows = (
        await session.execute(
            text(
                """
                SELECT id, name, normalized_name, set_code, external_id,
                       image_url, image_uris, game_code
                FROM tcg_judge.card_catalog
                WHERE game_code = 'LORCANA'
                """
            )
        )
    ).mappings().all()

    by_set_num: dict[tuple[str, str], dict[str, Any]] = {}
    by_set_name: dict[tuple[str, str], dict[str, Any]] = {}
    for raw in rows:
        card = dict(raw)
        set_code = str(card.get("set_code") or "").upper()
        if not set_code:
            continue
        ext = str(card.get("external_id") or "")
        num_part = ext.rsplit("-", 1)[-1] if ext else ""
        num = _normalize_card_number(num_part)
        if num:
            by_set_num[(set_code, num)] = card
            # Também guarda com zero-pad (041)
            if num_part and num_part != num:
                by_set_num[(set_code, num_part)] = card
        nname = card.get("normalized_name") or normalize_name(str(card.get("name") or ""))
        if nname:
            by_set_name[(set_code, nname)] = card
    return by_set_num, by_set_name


def match_liga_lorcana_catalog(
    *,
    base_name: str,
    liga_set: str,
    card_number: str,
    by_set_num: dict[tuple[str, str], dict[str, Any]],
    by_set_name: dict[tuple[str, str], dict[str, Any]],
) -> dict[str, Any] | None:
    catalog_set = _catalog_set_from_liga(liga_set)
    num = _normalize_card_number(card_number)
    nname = normalize_name(base_name)

    if catalog_set and num:
        hit = by_set_num.get((catalog_set, num))
        if hit:
            return hit
    if catalog_set and nname:
        hit = by_set_name.get((catalog_set, nname))
        if hit:
            return hit
    # Fallback: nome único no set map (sem set Liga mapeado)
    if nname and not catalog_set:
        candidates = [c for (sc, nn), c in by_set_name.items() if nn == nname]
        if len(candidates) == 1:
            return candidates[0]
    return None


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

    by_set_num: dict[tuple[str, str], dict[str, Any]] = {}
    by_set_name: dict[tuple[str, str], dict[str, Any]] = {}
    if liga_mode:
        by_set_num, by_set_name = await _load_lorcana_catalog_index(session)

    imported = 0
    skipped = 0
    matched = 0
    unmatched = 0
    errors: list[str] = []
    preview: list[dict[str, Any]] = []
    to_insert: list[dict[str, Any]] = []

    for line_no, row in enumerate(reader, start=2):
        parsed, err = parse_row(row, line_no)
        if err:
            errors.append(err)
            skipped += 1
            continue
        if not parsed:
            continue

        catalog_card_id: str | None = None
        images: list[str] | None = None
        tcg_id = parsed.get("tcg_id")
        catalog_matched = False
        if liga_mode:
            # Sempre Lorcana no formato Liga — mesmo sem match no catálogo.
            tcg_id = "LORCANA"
            card = match_liga_lorcana_catalog(
                base_name=str(parsed.get("base_name") or ""),
                liga_set=str(parsed.get("liga_set") or ""),
                card_number=str(parsed.get("card_number") or ""),
                by_set_num=by_set_num,
                by_set_name=by_set_name,
            )
            if card:
                catalog_card_id = str(card["id"])
                images = _image_list_from_catalog(card)
                catalog_matched = True
                matched += 1
            else:
                unmatched += 1

        preview_row = {
            "name": parsed["name"],
            "category": parsed["category"],
            "price_cents": parsed["price_cents"],
            "stock": parsed["stock"],
            "sku": parsed.get("sku"),
            "description": parsed.get("description"),
            "line": line_no,
            "catalog_matched": catalog_matched,
            "has_image": bool(images),
        }
        preview.append(preview_row)
        if dry_run:
            imported += 1
            continue

        to_insert.append(
            {
                "name": parsed["name"],
                "description": parsed.get("description"),
                "tcg_id": tcg_id,
                "category": parsed["category"],
                "price_cents": parsed["price_cents"],
                "stock": parsed["stock"],
                "sku": parsed.get("sku"),
                "images": images,
                "catalog_card_id": catalog_card_id,
            }
        )

    if not dry_run and to_insert:
        try:
            imported = await shop_products.bulk_create_products(
                session,
                store_id,
                owner_id,
                to_insert,
            )
        except HTTPException as exc:
            detail = exc.detail if isinstance(exc.detail, str) else str(exc.detail)
            errors.append(f"Importação em lote: {detail}")
            skipped += len(to_insert)
            imported = 0

    return {
        "imported": imported,
        "skipped": skipped,
        "errors": errors[:50],
        "dry_run": dry_run,
        "format": "liga_lorcana" if liga_mode else "judgetcg",
        "preview": preview[:50] if dry_run else [],
        "catalog_matched": matched if liga_mode else None,
        "catalog_unmatched": unmatched if liga_mode else None,
        "rollback_supported": False,
    }


async def backfill_liga_lorcana_images(
    session: AsyncSession,
    store_id: str,
    owner_id: str,
) -> dict[str, Any]:
    """Religa singles importados da Liga ao catálogo e preenche images.

    Também normaliza LOR* → siglas do catálogo (TFC, ROF, …) em sku/description/name.
    """
    await _assert_store_owner(session, store_id, owner_id)
    by_set_num, by_set_name = await _load_lorcana_catalog_index(session)
    catalog_codes = "|".join(sorted(LIGA_LORCANA_SET_MAP.values(), key=len, reverse=True))

    rows = (
        await session.execute(
            text(
                f"""
                SELECT id, name, description, sku, images, catalog_card_id
                FROM tcg_judge.store_products
                WHERE store_id = :sid
                  AND category = 'single'
                  AND is_active
                  AND (
                    catalog_card_id IS NULL
                    OR images IS NULL
                    OR cardinality(images) = 0
                    OR COALESCE(sku, '') ~ 'LOR[0-9]+'
                    OR COALESCE(description, '') ~ 'LOR[0-9]+'
                    OR COALESCE(name, '') ~ 'LOR[0-9]+'
                  )
                  AND (
                    description ILIKE '%LigaLorcana%'
                    OR sku ~ '^LOR[0-9]+-'
                    OR sku ~ '^({catalog_codes})-'
                    OR description ~ '(LOR[0-9]+|{catalog_codes})'
                  )
                """
            ),
            {"sid": store_id},
        )
    ).mappings().all()

    updated = 0
    rewritten = 0
    unmatched = 0
    for raw in rows:
        row = dict(raw)
        desc = str(row.get("description") or "")
        sku = str(row.get("sku") or "")
        name = str(row.get("name") or "")

        new_sku = rewrite_liga_set_codes(sku)
        new_desc = rewrite_liga_set_codes(desc)
        new_name = rewrite_liga_set_codes(name)
        codes_changed = (new_sku, new_desc, new_name) != (sku, desc, name)

        liga_set = ""
        m_set = (
            re.search(r"\b(LOR\d+)\b", desc, re.I)
            or re.search(r"^(LOR\d+)-", sku, re.I)
            or re.search(rf"\b({catalog_codes})\b", new_desc)
            or re.search(rf"^({catalog_codes})-", new_sku)
        )
        if m_set:
            liga_set = m_set.group(1).upper()

        card_number = ""
        m_num = re.search(r"#(\d+)", new_desc) or re.search(r"#(\d+)", desc)
        if m_num:
            card_number = m_num.group(1)
        elif new_sku:
            # SKU: TFC-26-NM ou TFC-103-NM-F (número pode ser Carta ID da Liga)
            parts = new_sku.split("-")
            if len(parts) >= 2 and parts[1].isdigit():
                card_number = parts[1]

        base_name = re.sub(r"\s*★\s*", " ", new_name)
        base_name = re.sub(r"\s*-\s*(?:LOR\d+|" + catalog_codes + r")\s*", " ", base_name, flags=re.I)
        base_name = re.sub(r"\s*\((M|NM|SP|MP|HP|D)\)\s*$", "", base_name).strip()
        base_name = re.sub(r"\s{2,}", " ", base_name)

        card = match_liga_lorcana_catalog(
            base_name=base_name,
            liga_set=liga_set,
            card_number=card_number,
            by_set_num=by_set_num,
            by_set_name=by_set_name,
        )
        # Se o "número" do SKU for Carta ID da Liga (ex. 1324), tenta só por nome+set.
        if not card and liga_set and base_name:
            card = match_liga_lorcana_catalog(
                base_name=base_name,
                liga_set=liga_set,
                card_number="",
                by_set_num=by_set_num,
                by_set_name=by_set_name,
            )

        if not card and not codes_changed:
            unmatched += 1
            continue

        params: dict[str, Any] = {
            "id": str(row["id"]),
            "sku": new_sku or None,
            "desc": new_desc or None,
            "name": new_name,
        }
        if card:
            images = _image_list_from_catalog(card)
            params["cid"] = str(card["id"])
            if images:
                await session.execute(
                    text(
                        """
                        UPDATE tcg_judge.store_products
                        SET catalog_card_id = :cid,
                            tcg_id = 'LORCANA',
                            images = :images,
                            sku = :sku,
                            description = :desc,
                            name = :name,
                            updated_at = NOW()
                        WHERE id = :id
                        """
                    ),
                    {**params, "images": images},
                )
            else:
                await session.execute(
                    text(
                        """
                        UPDATE tcg_judge.store_products
                        SET catalog_card_id = :cid,
                            tcg_id = 'LORCANA',
                            sku = :sku,
                            description = :desc,
                            name = :name,
                            updated_at = NOW()
                        WHERE id = :id
                        """
                    ),
                    params,
                )
            updated += 1
        else:
            await session.execute(
                text(
                    """
                    UPDATE tcg_judge.store_products
                    SET sku = :sku,
                        description = :desc,
                        name = :name,
                        updated_at = NOW()
                    WHERE id = :id
                    """
                ),
                params,
            )
            rewritten += 1
            unmatched += 1

    await session.commit()
    return {
        "scanned": len(rows),
        "updated": updated,
        "rewritten_only": rewritten,
        "unmatched": unmatched,
    }
