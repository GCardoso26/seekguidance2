"""Catalog Intelligence — insights derivados apenas do Bounded Context Catalog.

Não importa Marketplace. Não hardcoda combos. Usa projeções/joins em card_catalog
e card_prices (read models do próprio catálogo).
"""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import Any
from uuid import UUID

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.catalog.search_service import _card_payload


def _parse_uuid(card_id: str) -> UUID | None:
    try:
        return UUID(str(card_id))
    except ValueError:
        return None


def _extract_taxonomy(game_data: dict[str, Any] | None) -> dict[str, Any]:
    gd = game_data or {}
    type_line = str(gd.get("type_line") or gd.get("type") or gd.get("types") or "")
    types: list[str] = []
    subtypes: list[str] = []
    if isinstance(gd.get("types"), list):
        types = [str(t) for t in gd["types"] if t]
    elif type_line:
        if "—" in type_line or "–" in type_line:
            parts = type_line.replace("–", "—").split("—", 1)
            types = [t.strip() for t in parts[0].split() if t.strip()]
            subtypes = [t.strip() for t in parts[1].split() if t.strip()] if len(parts) > 1 else []
        else:
            types = [t.strip() for t in type_line.split() if t.strip()]

    if isinstance(gd.get("subtypes"), list):
        subtypes = [str(t) for t in gd["subtypes"] if t] or subtypes

    finishes: list[str] = []
    finish = gd.get("finish") or gd.get("finishes")
    if isinstance(finish, list):
        finishes = [str(f) for f in finish if f]
    elif finish:
        finishes = [str(finish)]

    for key, label in (
        ("promo", "promo"),
        ("borderless", "borderless"),
        ("extended_art", "extended_art"),
        ("full_art", "full_art"),
        ("etched", "etched"),
        ("showcase", "showcase"),
    ):
        if gd.get(key) is True or label in finishes:
            if label not in finishes:
                finishes.append(label)

    errata = gd.get("errata") or gd.get("printed_text")
    erratas: list[dict[str, str]] = []
    if isinstance(errata, list):
        for item in errata:
            if isinstance(item, dict) and item.get("text"):
                erratas.append(
                    {
                        "date": str(item.get("date") or ""),
                        "text": str(item["text"]),
                        "source": str(item.get("source") or "catalog"),
                    }
                )
            elif isinstance(item, str) and item.strip():
                erratas.append({"date": "", "text": item.strip(), "source": "catalog"})
    elif isinstance(errata, str) and errata.strip():
        erratas.append({"date": "", "text": errata.strip(), "source": "catalog"})

    return {
        "typeLine": type_line or None,
        "types": types,
        "subtypes": subtypes,
        "finishes": finishes,
        "erratas": erratas,
        "power": gd.get("power"),
        "toughness": gd.get("toughness"),
        "manaCost": gd.get("mana_cost") or gd.get("manaCost"),
        "cmc": gd.get("cmc") or gd.get("converted_mana_cost"),
        "colors": gd.get("colors") or gd.get("color_identity"),
    }


async def _base_card(session: AsyncSession, card_id: UUID) -> dict[str, Any] | None:
    row = (
        await session.execute(
            text(
                """
                SELECT id, game_code, name, normalized_name, set_code, set_name,
                       card_number, rarity, language, game_data, image_url, image_uris
                FROM tcg_judge.card_catalog
                WHERE id = :id
                """
            ),
            {"id": card_id},
        )
    ).mappings().first()
    return dict(row) if row else None


async def _related_same_set(
    session: AsyncSession, *, card_id: UUID, set_code: str | None, limit: int = 8
) -> list[dict[str, Any]]:
    if not set_code:
        return []
    week_ago = datetime.now(UTC) - timedelta(days=7)
    rows = (
        await session.execute(
            text(
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
                  ORDER BY cp.recorded_at DESC LIMIT 1
                ) latest ON TRUE
                LEFT JOIN LATERAL (
                  SELECT MIN(cp2.price_cents) AS min_cents
                  FROM tcg_judge.card_prices cp2 WHERE cp2.card_id = cc.id
                ) minp ON TRUE
                LEFT JOIN LATERAL (
                  SELECT cp3.price_cents AS week_ago_cents
                  FROM tcg_judge.card_prices cp3
                  WHERE cp3.card_id = cc.id AND cp3.recorded_at <= :week_ago
                  ORDER BY cp3.recorded_at DESC LIMIT 1
                ) week_ago ON TRUE
                LEFT JOIN LATERAL (
                  SELECT COUNT(*)::int AS cnt FROM tcg_judge.card_prices cp4
                  WHERE cp4.card_id = cc.id
                ) listings ON TRUE
                WHERE cc.set_code = :set_code AND cc.id <> :card_id
                ORDER BY cc.rarity DESC NULLS LAST, cc.name ASC
                LIMIT :lim
                """
            ),
            {"set_code": set_code, "card_id": card_id, "week_ago": week_ago, "lim": limit},
        )
    ).mappings().all()
    return [_card_payload(dict(r)) for r in rows]


async def _language_and_finish_variants(
    session: AsyncSession, *, card_id: UUID, normalized_name: str | None, game_code: str
) -> list[dict[str, Any]]:
    if not normalized_name:
        return []
    rows = (
        await session.execute(
            text(
                """
                SELECT cc.id, cc.name, cc.language, cc.set_code, cc.set_name,
                       cc.card_number, cc.rarity, cc.image_url, cc.game_data,
                       minp.min_cents AS lowest_price_cents
                FROM tcg_judge.card_catalog cc
                LEFT JOIN LATERAL (
                  SELECT MIN(cp.price_cents) AS min_cents
                  FROM tcg_judge.card_prices cp WHERE cp.card_id = cc.id
                ) minp ON TRUE
                WHERE cc.game_code = :game
                  AND cc.normalized_name = :nname
                  AND cc.id <> :card_id
                ORDER BY cc.language, cc.set_code
                LIMIT 24
                """
            ),
            {"game": game_code, "nname": normalized_name, "card_id": card_id},
        )
    ).mappings().all()
    out: list[dict[str, Any]] = []
    for r in rows:
        gd = r.get("game_data") or {}
        finishes = []
        if isinstance(gd, dict):
            tax = _extract_taxonomy(gd)
            finishes = tax["finishes"]
        out.append(
            {
                "id": str(r["id"]),
                "name": r["name"],
                "language": r["language"],
                "setCode": r["set_code"],
                "setName": r["set_name"],
                "number": r["card_number"],
                "rarity": r["rarity"],
                "imageUrl": r["image_url"],
                "finishes": finishes,
                "lowestPrice": round(int(r["lowest_price_cents"]) / 100, 2) if r["lowest_price_cents"] else None,
                "kind": "variant",
            }
        )
    return out


async def _staples_same_rarity(
    session: AsyncSession, *, card_id: UUID, game_code: str, rarity: str | None, limit: int = 6
) -> list[dict[str, Any]]:
    if not rarity:
        return []
    rows = (
        await session.execute(
            text(
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
                       NULL::int AS week_ago_price_cents,
                       listings.cnt AS listing_count
                FROM tcg_judge.card_catalog cc
                LEFT JOIN LATERAL (
                  SELECT cp.price_cents, cp.currency, cp.condition, cp.foil, cp.source
                  FROM tcg_judge.card_prices cp
                  WHERE cp.card_id = cc.id
                  ORDER BY cp.recorded_at DESC LIMIT 1
                ) latest ON TRUE
                LEFT JOIN LATERAL (
                  SELECT MIN(cp2.price_cents) AS min_cents
                  FROM tcg_judge.card_prices cp2 WHERE cp2.card_id = cc.id
                ) minp ON TRUE
                LEFT JOIN LATERAL (
                  SELECT COUNT(*)::int AS cnt FROM tcg_judge.card_prices cp4
                  WHERE cp4.card_id = cc.id
                ) listings ON TRUE
                WHERE cc.game_code = :game
                  AND cc.rarity = :rarity
                  AND cc.id <> :card_id
                  AND listings.cnt > 0
                ORDER BY listings.cnt DESC NULLS LAST, minp.min_cents ASC NULLS LAST
                LIMIT :lim
                """
            ),
            {"game": game_code, "rarity": rarity, "card_id": card_id, "lim": limit},
        )
    ).mappings().all()
    return [_card_payload(dict(r)) for r in rows]


async def _price_market_stats(session: AsyncSession, card_id: UUID) -> dict[str, Any]:
    row = (
        await session.execute(
            text(
                """
                SELECT
                  COUNT(*)::int AS sample_count,
                  MIN(price_cents)::bigint AS min_cents,
                  MAX(price_cents)::bigint AS max_cents,
                  AVG(price_cents)::float AS avg_cents,
                  COUNT(DISTINCT date_trunc('day', recorded_at))::int AS days_with_data
                FROM tcg_judge.card_prices
                WHERE card_id = :id
                  AND recorded_at >= NOW() - INTERVAL '90 days'
                """
            ),
            {"id": card_id},
        )
    ).mappings().first()
    if not row or int(row["sample_count"] or 0) == 0:
        return {
            "sampleCount": 0,
            "minPrice": None,
            "maxPrice": None,
            "avgPrice": None,
            "daysWithData": 0,
            "demandSignal": "unknown",
        }
    samples = int(row["sample_count"])
    demand = "high" if samples >= 40 else "medium" if samples >= 10 else "low"
    return {
        "sampleCount": samples,
        "minPrice": round(int(row["min_cents"]) / 100, 2) if row["min_cents"] else None,
        "maxPrice": round(int(row["max_cents"]) / 100, 2) if row["max_cents"] else None,
        "avgPrice": round(float(row["avg_cents"]) / 100, 2) if row["avg_cents"] else None,
        "daysWithData": int(row["days_with_data"] or 0),
        "demandSignal": demand,
    }


async def get_card_intelligence(session: AsyncSession, card_id: str) -> dict[str, Any] | None:
    uid = _parse_uuid(card_id)
    if not uid:
        return None
    base = await _base_card(session, uid)
    if not base:
        return None

    taxonomy = _extract_taxonomy(base.get("game_data") if isinstance(base.get("game_data"), dict) else {})
    same_set = await _related_same_set(session, card_id=uid, set_code=base.get("set_code"))
    variants = await _language_and_finish_variants(
        session,
        card_id=uid,
        normalized_name=base.get("normalized_name"),
        game_code=str(base["game_code"]),
    )
    staples = await _staples_same_rarity(
        session,
        card_id=uid,
        game_code=str(base["game_code"]),
        rarity=base.get("rarity"),
    )
    market = await _price_market_stats(session, uid)

    alternatives = same_set[:4]
    upgrades = [
        c for c in staples if (c.get("lowestPrice") or 0) > (market.get("avgPrice") or 0)
    ][:4]
    downgrades = [
        c for c in staples if (c.get("lowestPrice") or 0) and (c.get("lowestPrice") or 0) < (market.get("avgPrice") or 10**9)
    ][:4]

    competitiveness = "high"
    if market.get("demandSignal") == "high" and market.get("sampleCount", 0) > 20:
        competitiveness = "high"
    elif market.get("demandSignal") == "medium":
        competitiveness = "medium"
    else:
        competitiveness = "low"

    return {
        "cardId": str(uid),
        "taxonomy": taxonomy,
        "related": {
            "sameSet": same_set,
            "alternatives": alternatives,
            "staples": staples,
            "upgrades": upgrades,
            "downgrades": downgrades,
            "frequentlyTogether": same_set[:3],
            "commanderHints": [
                c for c in same_set if "legend" in str((c.get("gameData") or {}).get("type_line") or "").lower()
            ][:4],
        },
        "variants": variants,
        "marketStats": market,
        "sellerAiHints": {
            "suggestedPrice": market.get("avgPrice"),
            "demand": market.get("demandSignal"),
            "competitiveness": competitiveness,
            "velocityHint": "rápida" if market.get("demandSignal") == "high" else "moderada" if market.get("demandSignal") == "medium" else "lenta",
        },
        "generatedAt": datetime.now(UTC).isoformat(),
        "source": "catalog_intelligence_v1",
    }
