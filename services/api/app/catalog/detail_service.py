"""Detalhe de carta, histórico de preços e ofertas (catálogo + marketplace)."""

from __future__ import annotations

from collections import defaultdict
from datetime import UTC, datetime, timedelta
from typing import Any
from uuid import UUID

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.catalog.intelligence_service import _extract_taxonomy, get_card_intelligence
from app.catalog.search_service import _card_payload

# ACL Marketplace: ofertas vêm via adapter de leitura (não domain write).
# Mantido como port temporário — Catalog não deve crescer SQL de Marketplace.

RANGE_DAYS: dict[str, int] = {
    "7d": 7,
    "30d": 30,
    "90d": 90,
    "1y": 365,
    "all": 3650,
}

VALID_CONDITIONS = frozenset({"NM", "LP", "MP", "HP", "DM"})


def _parse_uuid(card_id: str) -> UUID:
    try:
        return UUID(str(card_id))
    except ValueError as exc:
        raise ValueError("invalid_card_id") from exc


def _market_currency(card: dict[str, Any], listings: list[dict[str, Any]]) -> str:
    """Resolve currency without crashing when latestPrice is explicitly None."""
    if listings:
        raw = listings[0].get("currency")
        if raw:
            return str(raw)
    latest = card.get("latestPrice")
    if isinstance(latest, dict):
        raw = latest.get("currency")
        if raw:
            return str(raw)
    return "BRL"


def _game_detail_fields(game_data: dict[str, Any] | None) -> dict[str, Any]:
    gd = game_data if isinstance(game_data, dict) else {}
    legalities = gd.get("legalities") or gd.get("legality") or {}
    if isinstance(legalities, dict):
        legalities = {
            str(k): str(v)
            for k, v in legalities.items()
            if str(v) in {"legal", "not_legal", "banned", "restricted"}
        }
    else:
        legalities = {}

    rulings_raw = gd.get("rulings") or []
    rulings: list[dict[str, str]] = []
    if isinstance(rulings_raw, list):
        for item in rulings_raw:
            if isinstance(item, dict) and item.get("text"):
                rulings.append(
                    {
                        "date": str(item.get("published_at") or item.get("date") or ""),
                        "text": str(item["text"]),
                    }
                )

    return {
        "oracleText": gd.get("oracle_text") or gd.get("oracleText") or gd.get("desc"),
        "flavorText": gd.get("flavor_text") or gd.get("flavorText"),
        "artist": gd.get("artist"),
        "legalities": legalities or None,
        "rulings": rulings or None,
    }


def _normalize_price_history(prices: list[dict[str, Any]]) -> list[dict[str, Any]]:
    daily: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for row in prices:
        recorded = row.get("recorded_at")
        if not recorded:
            continue
        day = str(recorded)[:10]
        daily[day].append(row)

    result: list[dict[str, Any]] = []
    for day in sorted(daily.keys()):
        rows = daily[day]
        avg_cents = sum(int(r["price_cents"]) for r in rows) / len(rows)
        sample = rows[0]
        result.append(
            {
                "date": day,
                "price": round(avg_cents / 100, 2),
                "condition": sample.get("condition") or "NM",
                "foil": bool(sample.get("foil")),
                "volume": len(rows),
            }
        )
    return result


def _store_product_matches_card(row: dict[str, Any], card_id: str) -> bool:
    """Reject products whose catalog_card_id points at a different card."""
    catalog_card_id = row.get("catalog_card_id")
    if catalog_card_id is None:
        return True
    return str(catalog_card_id) == str(card_id)


def _listing_from_store(row: dict[str, Any], *, card_id: str) -> dict[str, Any]:
    images = row.get("images") or []
    image_list = [str(i) for i in images if i]
    return {
        "id": str(row["id"]),
        "cardId": card_id,
        "sellerId": str(row["store_id"]),
        "sellerName": str(row.get("store_name") or "Loja"),
        "sellerReputation": 4.5,
        "sellerAvatar": row.get("store_logo"),
        "condition": "NM",
        "price": round(int(row["price_cents"]) / 100, 2),
        "currency": "BRL",
        "quantity": int(row.get("stock") or 0),
        "foil": False,
        "language": "pt",
        "description": row.get("description"),
        "images": image_list,
        "createdAt": str(row.get("created_at") or datetime.now(UTC).isoformat()),
        "productId": str(row["id"]),
    }


def _listing_from_market_price(row: dict[str, Any], *, card_id: str) -> dict[str, Any]:
    source = str(row.get("source") or "market")
    return {
        "id": f"market-{row.get('condition')}-{int(bool(row.get('foil')))}-{source}",
        "cardId": card_id,
        "sellerId": source,
        "sellerName": f"Referência ({source})",
        "sellerReputation": 5.0,
        "condition": str(row.get("condition") or "NM"),
        "price": round(int(row["price_cents"]) / 100, 2),
        "currency": str(row.get("currency") or "USD"),
        "quantity": 1,
        "foil": bool(row.get("foil")),
        "language": "en",
        "description": "Preço de referência do mercado (catálogo).",
        "createdAt": str(row.get("recorded_at") or datetime.now(UTC).isoformat()),
    }


async def _fetch_card_row(session: AsyncSession, card_id: UUID) -> dict[str, Any] | None:
    week_ago = datetime.now(UTC) - timedelta(days=7)
    sql = text(
        """
        SELECT cc.id, cc.game_code, cc.external_id, cc.name, cc.normalized_name,
               cc.set_code, cc.set_name, cc.card_number, cc.rarity, cc.image_url,
               cc.image_uris, cc.game_data, cc.language, cc.source, cc.version,
               cc.is_reprint, cc.last_synced_at,
               latest.price_cents AS latest_price_cents,
               latest.currency AS latest_currency,
               latest.condition AS latest_condition,
               latest.foil AS latest_foil,
               latest.source AS latest_source,
               latest.recorded_at AS latest_recorded_at,
               minp.min_cents AS lowest_price_cents,
               week_ago.week_ago_cents AS week_ago_price_cents,
               listings.cnt AS listing_count
        FROM tcg_judge.card_catalog cc
        LEFT JOIN LATERAL (
          SELECT cp.price_cents, cp.currency, cp.condition, cp.foil, cp.source, cp.recorded_at
          FROM tcg_judge.card_prices cp
          WHERE cp.card_id = cc.id
          ORDER BY cp.recorded_at DESC
          LIMIT 1
        ) latest ON TRUE
        LEFT JOIN LATERAL (
          SELECT MIN(cp2.price_cents) AS min_cents
          FROM tcg_judge.card_prices cp2
          WHERE cp2.card_id = cc.id
        ) minp ON TRUE
        LEFT JOIN LATERAL (
          SELECT cp3.price_cents AS week_ago_cents
          FROM tcg_judge.card_prices cp3
          WHERE cp3.card_id = cc.id AND cp3.recorded_at <= :week_ago
          ORDER BY cp3.recorded_at DESC
          LIMIT 1
        ) week_ago ON TRUE
        LEFT JOIN LATERAL (
          SELECT COUNT(*)::int AS cnt
          FROM tcg_judge.card_prices cp4
          WHERE cp4.card_id = cc.id
        ) listings ON TRUE
        WHERE cc.id = :card_id
        """
    )
    row = (await session.execute(sql, {"card_id": card_id, "week_ago": week_ago})).mappings().first()
    return dict(row) if row else None


async def _fetch_prices_by_condition(session: AsyncSession, card_id: UUID) -> list[dict[str, Any]]:
    sql = text(
        """
        SELECT DISTINCT ON (cp.condition, cp.foil)
               cp.condition, cp.foil, cp.price_cents, cp.currency, cp.recorded_at
        FROM tcg_judge.card_prices cp
        WHERE cp.card_id = :card_id
        ORDER BY cp.condition, cp.foil, cp.recorded_at DESC
        """
    )
    rows = (await session.execute(sql, {"card_id": card_id})).mappings().all()
    result: list[dict[str, Any]] = []
    for row in rows:
        result.append(
            {
                "condition": str(row["condition"] or "NM"),
                "foil": bool(row["foil"]),
                "price": round(int(row["price_cents"]) / 100, 2),
                "currency": str(row["currency"] or "USD"),
                "listingCount": 1,
            }
        )
    return sorted(result, key=lambda x: (x["condition"], x["foil"]))


async def _fetch_store_listings(
    session: AsyncSession,
    *,
    card_id: UUID,
    game_code: str,
    card_name: str,
    normalized_name: str | None,
) -> list[dict[str, Any]]:
    """Match by catalog_card_id or product name — never by game_code alone.

    `game_code` is kept for call-site compatibility but must not broaden the
    match set (that caused wrong productId on PDPs, e.g. Buzz under Whole New World).
    """
    _ = game_code
    pattern = f"%{normalized_name or card_name}%"
    sql = text(
        """
        SELECT sp.id, sp.store_id, sp.name, sp.description, sp.price_cents,
               sp.stock, sp.images, sp.created_at, sp.catalog_card_id,
               s.name AS store_name, s.logo_url AS store_logo
        FROM tcg_judge.store_products sp
        JOIN tcg_judge.stores s ON s.id = sp.store_id
        WHERE sp.is_active = true
          AND s.shop_enabled = true
          AND (
            sp.catalog_card_id = CAST(:card_id AS uuid)
            OR (
              sp.catalog_card_id IS NULL
              AND sp.name ILIKE :pattern
            )
          )
        ORDER BY sp.price_cents ASC
        LIMIT 30
        """
    )
    rows = (
        await session.execute(
            sql,
            {"card_id": str(card_id), "pattern": pattern},
        )
    ).mappings().all()
    card_id_str = str(card_id)
    listings: list[dict[str, Any]] = []
    for r in rows:
        row = dict(r)
        if not _store_product_matches_card(row, card_id_str):
            continue
        listings.append(_listing_from_store(row, card_id=card_id_str))
    return listings


async def _fetch_market_listings(session: AsyncSession, card_id: UUID) -> list[dict[str, Any]]:
    sql = text(
        """
        SELECT DISTINCT ON (cp.condition, cp.foil, cp.source)
               cp.condition, cp.foil, cp.price_cents, cp.currency, cp.source, cp.recorded_at
        FROM tcg_judge.card_prices cp
        WHERE cp.card_id = :card_id
        ORDER BY cp.condition, cp.foil, cp.source, cp.recorded_at DESC
        """
    )
    rows = (await session.execute(sql, {"card_id": card_id})).mappings().all()
    return [_listing_from_market_price(dict(r), card_id=str(card_id)) for r in rows]


async def _fetch_related_cards(session: AsyncSession, *, card_id: UUID, set_code: str | None) -> list[dict[str, Any]]:
    if not set_code:
        return []
    week_ago = datetime.now(UTC) - timedelta(days=7)
    sql = text(
        """
        SELECT cc.id, cc.game_code, cc.external_id, cc.name, cc.normalized_name,
               cc.set_code, cc.set_name, cc.card_number, cc.rarity, cc.image_url,
               cc.image_uris, cc.game_data, cc.language, cc.source, cc.version,
               cc.is_reprint, cc.last_synced_at,
               latest.price_cents AS latest_price_cents,
               latest.currency AS latest_currency,
               latest.condition AS latest_condition,
               latest.foil AS latest_foil,
               latest.source AS latest_source,
               minp.min_cents AS lowest_price_cents,
               week_ago.week_ago_cents AS week_ago_price_cents,
               listings.cnt AS listing_count
        FROM tcg_judge.card_catalog cc
        LEFT JOIN LATERAL (
          SELECT cp.price_cents, cp.currency, cp.condition, cp.foil, cp.source
          FROM tcg_judge.card_prices cp
          WHERE cp.card_id = cc.id
          ORDER BY cp.recorded_at DESC
          LIMIT 1
        ) latest ON TRUE
        LEFT JOIN LATERAL (
          SELECT MIN(cp2.price_cents) AS min_cents
          FROM tcg_judge.card_prices cp2
          WHERE cp2.card_id = cc.id
        ) minp ON TRUE
        LEFT JOIN LATERAL (
          SELECT cp3.price_cents AS week_ago_cents
          FROM tcg_judge.card_prices cp3
          WHERE cp3.card_id = cc.id AND cp3.recorded_at <= :week_ago
          ORDER BY cp3.recorded_at DESC
          LIMIT 1
        ) week_ago ON TRUE
        LEFT JOIN LATERAL (
          SELECT COUNT(*)::int AS cnt
          FROM tcg_judge.card_prices cp4
          WHERE cp4.card_id = cc.id
        ) listings ON TRUE
        WHERE cc.set_code = :set_code AND cc.id <> :card_id
        ORDER BY cc.rarity DESC NULLS LAST, cc.name ASC
        LIMIT 8
        """
    )
    rows = (
        await session.execute(
            sql,
            {"set_code": set_code, "card_id": card_id, "week_ago": week_ago},
        )
    ).mappings().all()
    return [_card_payload(dict(r)) for r in rows]


async def get_card_detail(session: AsyncSession, card_id: str) -> dict[str, Any] | None:
    try:
        uid = _parse_uuid(card_id)
    except ValueError:
        return None

    row = await _fetch_card_row(session, uid)
    if not row:
        return None

    card = _card_payload(row)
    card.update(_game_detail_fields(row.get("game_data")))
    taxonomy = _extract_taxonomy(row.get("game_data") if isinstance(row.get("game_data"), dict) else {})
    card.update(
        {
            "typeLine": taxonomy.get("typeLine"),
            "types": taxonomy.get("types") or [],
            "subtypes": taxonomy.get("subtypes") or [],
            "finishes": taxonomy.get("finishes") or [],
            "erratas": taxonomy.get("erratas") or [],
            "manaCost": taxonomy.get("manaCost"),
            "cmc": taxonomy.get("cmc"),
            "colors": taxonomy.get("colors"),
            "power": taxonomy.get("power"),
            "toughness": taxonomy.get("toughness"),
        }
    )
    card["pricesByCondition"] = await _fetch_prices_by_condition(session, uid)

    if row.get("latest_recorded_at"):
        if card.get("latestPrice"):
            card["latestPrice"]["timestamp"] = str(row["latest_recorded_at"])

    thirty_days_ago = datetime.now(UTC) - timedelta(days=30)
    history_sql = text(
        """
        SELECT price_cents, currency, condition, foil, recorded_at
        FROM tcg_judge.card_prices
        WHERE card_id = :card_id AND recorded_at >= :since
        ORDER BY recorded_at ASC
        """
    )
    history_rows = (
        await session.execute(history_sql, {"card_id": uid, "since": thirty_days_ago})
    ).mappings().all()
    price_history = _normalize_price_history([dict(r) for r in history_rows])

    listings: list[dict[str, Any]] = []
    try:
        from app.marketplace.catalog_marketplace_adapter import CatalogMarketplaceAdapter

        adapter = CatalogMarketplaceAdapter(session)
        projections = await adapter.project_listings_for_card(str(uid))
        for projection in projections:
            dto = await adapter.to_marketplace_dto(projection)
            store = dto.get("store") or {}
            store_name = str(store.get("name") or "Loja")
            image_url = dto.get("image_url")
            store_product_id = dto.get("store_product_id")
            listings.append(
                {
                    "id": dto["listing_id"],
                    "cardId": dto["card_id"],
                    "sellerId": str(store.get("id") or ""),
                    "storeId": str(store.get("id") or ""),
                    "storeName": store_name,
                    # FE CardListing contract (avatar initial uses sellerName.charAt)
                    "sellerName": store_name,
                    "sellerReputation": float(store.get("trust_score") or 4.5),
                    "sellerAvatar": store.get("logo_url") or store.get("avatar_url"),
                    "price": round(int(dto["price_cents"]) / 100, 2),
                    "condition": str(dto.get("condition") or "NM"),
                    "currency": "BRL",
                    "quantity": int(dto.get("quantity") or 0),
                    "foil": bool(dto.get("foil")),
                    "language": str(dto.get("language") or "pt"),
                    "images": [str(image_url)] if image_url else [],
                    "imageUrl": image_url,
                    # Carrinho exige store_products.id — NÃO usar card_listings.id
                    "productId": str(store_product_id) if store_product_id else None,
                    "createdAt": str(dto.get("created_at") or datetime.now(UTC).isoformat()),
                }
            )
    except Exception:
        listings = []

    if not listings:
        try:
            from app.marketplace.card_listings import list_listings_by_card

            card_listings = await list_listings_by_card(session, str(uid))
            if card_listings:
                listings = card_listings
        except Exception:
            listings = []

    if not listings:
        store_listings = await _fetch_store_listings(
            session,
            card_id=uid,
            game_code=str(row["game_code"]),
            card_name=str(row["name"]),
            normalized_name=row.get("normalized_name"),
        )
        market_listings = await _fetch_market_listings(session, uid)
        listings = store_listings if store_listings else market_listings

    related = await _fetch_related_cards(
        session,
        card_id=uid,
        set_code=row.get("set_code"),
    )

    intelligence = None
    try:
        intelligence = await get_card_intelligence(session, str(uid))
    except Exception:
        intelligence = None
    trusts = [
        float(listing["sellerReputation"])
        for listing in listings
        if listing.get("sellerReputation") is not None
    ]
    avg_trust = round(sum(trusts) / len(trusts), 1) if trusts else None
    sold_volume = sum(int(p.get("volume") or 0) for p in price_history)
    market_summary = {
        "listedQuantity": sum(
            int(listing.get("quantity") or 0) for listing in listings
        ),
        "storeCount": len(
            {
                str(
                    listing.get("sellerId")
                    or listing.get("storeId")
                    or listing.get("id")
                )
                for listing in listings
            }
        ),
        "bestOffer": min(
            (
                float(listing["price"])
                for listing in listings
                if listing.get("price") is not None
            ),
            default=None,
        ),
        # latestPrice pode ser None (chave presente) — nunca .get(key, {}).get(...).
        "currency": _market_currency(card, listings),
        "soldVolume": sold_volume or None,
        "avgSellerTrust": avg_trust,
        "popularity": "alta" if len(listings) >= 8 else "média" if len(listings) >= 3 else "baixa",
    }
    if intelligence and intelligence.get("marketStats"):
        stats = intelligence["marketStats"]
        market_summary.update(
            {
                "avgPrice": stats.get("avgPrice"),
                "minPrice": stats.get("minPrice"),
                "maxPrice": stats.get("maxPrice"),
                "demandSignal": stats.get("demandSignal"),
                "suggestedPrice": stats.get("suggestedPrice") or stats.get("avgPrice"),
            }
        )
    hints = (intelligence or {}).get("sellerAiHints") or {}
    if hints:
        market_summary["suggestedPrice"] = hints.get("suggestedPrice") or market_summary.get(
            "suggestedPrice"
        )
        market_summary["sellVelocity"] = hints.get("velocityHint") or hints.get("demand")
        market_summary["competitiveness"] = hints.get("competitiveness")
        if not market_summary.get("popularity") and hints.get("demand"):
            market_summary["popularity"] = hints.get("demand")

    return {
        "card": card,
        "priceHistory": price_history,
        "listings": listings,
        "relatedCards": related,
        "marketSummary": market_summary,
        "intelligence": {
            "sellerAiHints": (intelligence or {}).get("sellerAiHints"),
            "variantsCount": len((intelligence or {}).get("variants") or []),
            "staplesCount": len(((intelligence or {}).get("related") or {}).get("staples") or []),
        }
        if intelligence
        else None,
    }


async def get_price_history(
    session: AsyncSession,
    card_id: str,
    *,
    range: str = "30d",
    condition: str | None = None,
    foil: bool | None = None,
) -> list[dict[str, Any]] | None:
    try:
        uid = _parse_uuid(card_id)
    except ValueError:
        return None

    exists = (
        await session.execute(
            text("SELECT 1 FROM tcg_judge.card_catalog WHERE id = :id"),
            {"id": uid},
        )
    ).first()
    if not exists:
        return None

    days = RANGE_DAYS.get(range, 30)
    since = datetime.now(UTC) - timedelta(days=days)

    clauses = ["card_id = :card_id", "recorded_at >= :since"]
    params: dict[str, Any] = {"card_id": uid, "since": since}

    if condition and condition.upper() in VALID_CONDITIONS:
        clauses.append("condition = :condition")
        params["condition"] = condition.upper()

    if foil is not None:
        clauses.append("foil = :foil")
        params["foil"] = foil

    sql = text(
        f"""
        SELECT price_cents, currency, condition, foil, recorded_at
        FROM tcg_judge.card_prices
        WHERE {" AND ".join(clauses)}
        ORDER BY recorded_at ASC
        """
    )
    rows = (await session.execute(sql, params)).mappings().all()
    return _normalize_price_history([dict(r) for r in rows])
