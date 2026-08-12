"""Import CSV de singles → match Master Catalog → create_listing (ADR-018 Fase 3)."""

from __future__ import annotations

import csv
import io
import re
from typing import Any

from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.marketplace import card_listings as card_listings_svc
from app.stores.accreditation import require_store_can_publish

VALID_CONDITIONS = frozenset({"NM", "LP", "MP", "HP", "DM"})

GAME_HINTS = {
    "lorcana": "LORCANA",
    "mtg": "MTG",
    "magic": "MTG",
    "pokemon": "POKEMON",
    "pokémon": "POKEMON",
    "yugioh": "YGO",
    "ygo": "YGO",
    "onepiece": "ONEPIECE",
    "one piece": "ONEPIECE",
    "digimon": "DIGIMON",
    "fab": "FAB",
    "riftbound": "RIFTBOUND",
}


def _norm(value: str) -> str:
    return re.sub(r"\s+", " ", value.strip().lower())


def _parse_price_cents(row: dict[str, str]) -> int | None:
    raw = (
        row.get("price_cents")
        or row.get("preco_centavos")
        or row.get("price")
        or row.get("preco")
        or ""
    ).strip()
    if not raw:
        return None
    cleaned = raw.replace("R$", "").replace(" ", "").replace(",", ".")
    try:
        if "." in cleaned and cleaned.replace(".", "", 1).isdigit():
            # reais com decimal → centavos
            return int(round(float(cleaned) * 100)) if float(cleaned) < 100_000 else int(float(cleaned))
        return int(float(cleaned))
    except ValueError:
        return None


def _parse_row(row: dict[str, str], line_no: int) -> tuple[dict[str, Any] | None, str | None]:
    name = (row.get("name") or row.get("nome") or "").strip()
    if not name:
        return None, None
    set_code = (row.get("set") or row.get("set_code") or row.get("expansion") or "").strip() or None
    condition = (row.get("condition") or row.get("condicao") or "NM").strip().upper()
    if condition not in VALID_CONDITIONS:
        return None, f"Linha {line_no}: condição inválida ({condition})"
    language = (row.get("language") or row.get("idioma") or "pt").strip().lower()[:10]
    qty_raw = (row.get("quantity") or row.get("qty") or row.get("estoque") or row.get("stock") or "1").strip()
    try:
        quantity = int(qty_raw)
    except ValueError:
        return None, f"Linha {line_no}: quantity inválida"
    if quantity < 1:
        return None, f"Linha {line_no}: quantity deve ser ≥ 1"
    price_cents = _parse_price_cents(row)
    if price_cents is None or price_cents <= 0:
        return None, f"Linha {line_no}: preço inválido"
    game = (row.get("game") or row.get("tcg") or "").strip().lower()
    game_code = GAME_HINTS.get(game) if game else None
    sku = (row.get("sku") or "").strip() or None
    return {
        "name": name,
        "set_code": set_code,
        "condition": condition,
        "language": language,
        "quantity": quantity,
        "price_cents": price_cents,
        "game_code": game_code,
        "sku": sku,
    }, None


async def match_master_catalog(
    session: AsyncSession,
    *,
    name: str,
    set_code: str | None,
    language: str,
    game_code: str | None,
) -> dict[str, Any] | None:
    """Resolve carta no Master Catalog (card_catalog). Preferência: set+nome → nome."""
    params: dict[str, Any] = {"name": _norm(name), "lang": language}
    clauses = [
        "(LOWER(TRIM(cc.name)) = :name OR LOWER(TRIM(COALESCE(cc.normalized_name, ''))) = :name)"
    ]
    if set_code:
        clauses.append(
            "(LOWER(COALESCE(cc.set_code, '')) = LOWER(:set_code) OR LOWER(COALESCE(cc.set_name, '')) = LOWER(:set_code))"
        )
        params["set_code"] = set_code
    if game_code:
        clauses.append("cc.game_code = :game")
        params["game"] = game_code
    if language:
        clauses.append("(cc.language IS NULL OR LOWER(cc.language) = LOWER(:lang) OR :lang = 'pt')")

    row = (
        await session.execute(
            text(
                f"""
                SELECT cc.id, cc.name, cc.game_code, cc.set_code, cc.set_name, cc.language
                FROM tcg_judge.card_catalog cc
                WHERE {' AND '.join(clauses)}
                ORDER BY
                  CASE WHEN LOWER(COALESCE(cc.set_code, '')) = LOWER(:set_code_ord) THEN 0 ELSE 1 END,
                  cc.name
                LIMIT 1
                """
            ),
            {**params, "set_code_ord": set_code or ""},
        )
    ).mappings().first()
    if row:
        return dict(row)

    # Fallback fuzzy por nome (+ set opcional)
    fuzzy_clauses = ["(cc.normalized_name ILIKE :pat OR cc.name ILIKE :pat)"]
    fuzzy_params: dict[str, Any] = {"pat": f"%{name.strip()}%"}
    if set_code:
        fuzzy_clauses.append(
            "(LOWER(COALESCE(cc.set_code, '')) = LOWER(:set_code) OR cc.set_name ILIKE :set_pat)"
        )
        fuzzy_params["set_code"] = set_code
        fuzzy_params["set_pat"] = f"%{set_code}%"
    if game_code:
        fuzzy_clauses.append("cc.game_code = :game")
        fuzzy_params["game"] = game_code

    row = (
        await session.execute(
            text(
                f"""
                SELECT cc.id, cc.name, cc.game_code, cc.set_code, cc.set_name, cc.language
                FROM tcg_judge.card_catalog cc
                WHERE {' AND '.join(fuzzy_clauses)}
                ORDER BY LENGTH(cc.name) ASC
                LIMIT 1
                """
            ),
            fuzzy_params,
        )
    ).mappings().first()
    return dict(row) if row else None


async def import_card_listings_csv(
    session: AsyncSession,
    store_id: str,
    owner_id: str,
    csv_text: str,
    *,
    dry_run: bool = False,
) -> dict[str, Any]:
    store_row = (
        await session.execute(
            text("SELECT * FROM tcg_judge.stores WHERE id = :id AND owner_id = :oid"),
            {"id": store_id, "oid": owner_id},
        )
    ).mappings().first()
    if not store_row:
        raise HTTPException(404, "Loja não encontrada")
    store = dict(store_row)
    require_store_can_publish(store)

    text_clean = csv_text.strip()
    if not text_clean:
        raise HTTPException(400, "CSV vazio")

    reader = csv.DictReader(io.StringIO(text_clean))
    if not reader.fieldnames:
        raise HTTPException(
            400,
            "CSV sem cabeçalho. Use: sku,name,set,condition,language,price,quantity[,game]",
        )

    matched = 0
    imported = 0
    unmatched: list[dict[str, Any]] = []
    errors: list[str] = []

    for line_no, row in enumerate(reader, start=2):
        # normalize keys
        norm_row = {(k or "").strip().lower(): (v or "") for k, v in row.items()}
        parsed, err = _parse_row(norm_row, line_no)
        if err:
            errors.append(err)
            continue
        if not parsed:
            continue

        card = await match_master_catalog(
            session,
            name=parsed["name"],
            set_code=parsed["set_code"],
            language=parsed["language"],
            game_code=parsed["game_code"],
        )
        if not card:
            unmatched.append(
                {
                    "line": line_no,
                    "name": parsed["name"],
                    "set": parsed["set_code"],
                    "sku": parsed["sku"],
                }
            )
            continue

        matched += 1
        if dry_run:
            continue
        try:
            await card_listings_svc.create_listing(
                session,
                owner_id,
                card_id=str(card["id"]),
                condition=parsed["condition"],
                price_cents=parsed["price_cents"],
                quantity=parsed["quantity"],
                foil=False,
                language=parsed["language"],
                description=f"SKU {parsed['sku']}" if parsed["sku"] else None,
            )
            imported += 1
        except HTTPException as exc:
            detail = exc.detail if isinstance(exc.detail, str) else str(exc.detail)
            errors.append(f"Linha {line_no} ({parsed['name']}): {detail}")

    if not dry_run and imported > 0:
        await session.execute(
            text(
                """
                UPDATE tcg_judge.stores
                SET last_inventory_sync_at = NOW(), updated_at = NOW()
                WHERE id = :id
                """
            ),
            {"id": store_id},
        )
        await session.commit()

    return {
        "kind": "card_listings",
        "dry_run": dry_run,
        "matched": matched,
        "imported": imported,
        "unmatched_count": len(unmatched),
        "unmatched": unmatched[:50],
        "errors": errors[:50],
        "template": "sku,name,set,condition,language,price,quantity,game",
    }
