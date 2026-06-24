"""Validação de cobertura de coleções (sets) e imagens por TCG."""

from __future__ import annotations

from typing import Any

import httpx
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.tcg_adapters.set_sources import (
    METADATA_ONLY_SETS,
    SET_COVERAGE_GAMES,
    SOURCE_GAP_SETS,
    SWU_API,
    fetch_source_sets,
)
from app.tcg_adapters.sync_swu import _swu_cards_payload


async def _source_set_card_count(game_code: str, set_code: str) -> int | None:
    code = game_code.upper()
    try:
        async with httpx.AsyncClient(timeout=45.0) as client:
            if code == "SWU":
                res = await client.get(f"{SWU_API}/cards/{set_code.lower()}")
                if not res.is_success:
                    return 0 if res.status_code >= 500 else None
                return len(_swu_cards_payload(res.json()))
            if code == "LORCANA":
                res = await client.get("https://api.lorcana-api.com/bulk/cards")
                if not res.is_success:
                    return None
                cards = res.json()
                return sum(
                    1
                    for card in cards
                    if isinstance(card, dict)
                    and str(card.get("Set_ID") or card.get("set_id") or "") == set_code
                )
    except httpx.HTTPError:
        return None
    return None


async def _db_set_codes(session: AsyncSession, game_code: str) -> set[str]:
    rows = (
        await session.execute(
            text(
                """
                SELECT code AS set_code FROM tcg_judge.card_sets WHERE game_code = :g
                UNION
                SELECT DISTINCT set_code FROM tcg_judge.card_catalog
                WHERE game_code = :g AND set_code IS NOT NULL AND set_code <> ''
                """
            ),
            {"g": game_code},
        )
    ).mappings().all()
    return {str(row["set_code"]).strip() for row in rows if row.get("set_code")}


async def _db_set_card_counts(session: AsyncSession, game_code: str) -> dict[str, int]:
    if game_code.upper() == "YGO":
        rows = (
            await session.execute(
                text(
                    """
                    SELECT split_part(elem->>'set_code', '-', 1) AS set_code, count(DISTINCT cc.id) AS c
                    FROM tcg_judge.card_catalog cc
                    CROSS JOIN LATERAL jsonb_array_elements(
                      COALESCE(cc.game_data->'card_sets', '[]'::jsonb)
                    ) elem
                    WHERE cc.game_code = 'YGO'
                      AND elem->>'set_code' IS NOT NULL
                      AND elem->>'set_code' <> ''
                    GROUP BY split_part(elem->>'set_code', '-', 1)
                    """
                )
            )
        ).mappings().all()
        return {str(row["set_code"]): int(row["c"]) for row in rows}

    rows = (
        await session.execute(
            text(
                """
                SELECT set_code, count(*) AS c
                FROM tcg_judge.card_catalog
                WHERE game_code = :g AND set_code IS NOT NULL AND set_code <> ''
                GROUP BY set_code
                """
            ),
            {"g": game_code},
        )
    ).mappings().all()
    return {str(row["set_code"]): int(row["c"]) for row in rows}


def _classify_empty_set(
    game_code: str,
    set_code: str,
    meta: dict[str, Any],
    *,
    source_cards: int | None,
) -> str:
    if set_code in METADATA_ONLY_SETS.get(game_code, frozenset()):
        return "metadata_only"
    if set_code in SOURCE_GAP_SETS.get(game_code, frozenset()):
        return "source_gap"
    expected = meta.get("card_count")
    try:
        expected_count = int(expected) if expected is not None else None
    except (TypeError, ValueError):
        expected_count = None
    if expected_count == 0:
        return "metadata_only"
    if source_cards is not None and source_cards == 0 and (expected_count or 0) > 0:
        return "source_gap"
    return "sync_gap"


async def verify_image_coverage(
    session: AsyncSession,
    *,
    games: tuple[str, ...] | None = None,
    sample_size: int = 5,
) -> dict[str, Any]:
    targets = games or SET_COVERAGE_GAMES
    by_game: dict[str, Any] = {}
    all_ok = True

    for game in targets:
        row = (
            await session.execute(
                text(
                    """
                    SELECT
                      count(*) AS total,
                      count(*) FILTER (
                        WHERE image_url IS NOT NULL AND image_url <> ''
                      ) AS with_url,
                      count(*) FILTER (
                        WHERE (image_url IS NULL OR image_url = '')
                          AND (image_uris IS NULL OR image_uris = '{}'::jsonb)
                      ) AS missing
                    FROM tcg_judge.card_catalog
                    WHERE game_code = :g
                    """
                ),
                {"g": game},
            )
        ).mappings().first()

        total = int(row["total"]) if row else 0
        with_url = int(row["with_url"]) if row else 0
        missing = int(row["missing"]) if row else 0
        coverage_pct = round((with_url / total) * 100, 2) if total else 100.0
        game_ok = total == 0 or missing == 0

        samples = (
            await session.execute(
                text(
                    """
                    SELECT id, name, image_url, image_uris
                    FROM tcg_judge.card_catalog
                    WHERE game_code = :g
                      AND image_url IS NOT NULL AND image_url <> ''
                    ORDER BY last_synced_at DESC NULLS LAST
                    LIMIT :lim
                    """
                ),
                {"g": game, "lim": sample_size},
            )
        ).mappings().all()

        reachable = 0
        checked = 0
        broken_samples: list[dict[str, str]] = []
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            for sample in samples:
                url = sample.get("image_url")
                if not url:
                    continue
                checked += 1
                try:
                    res = await client.head(str(url))
                    if res.status_code >= 400:
                        res = await client.get(str(url))
                    if res.is_success:
                        reachable += 1
                    else:
                        broken_samples.append(
                            {
                                "name": str(sample.get("name") or ""),
                                "url": str(url),
                                "status": str(res.status_code),
                            }
                        )
                except httpx.HTTPError as exc:
                    broken_samples.append(
                        {
                            "name": str(sample.get("name") or ""),
                            "url": str(url),
                            "status": str(exc.__class__.__name__),
                        }
                    )

        http_ok = checked == 0 or reachable == checked
        if not game_ok or not http_ok:
            all_ok = False

        by_game[game] = {
            "total": total,
            "with_image_url": with_url,
            "missing_images": missing,
            "coverage_pct": coverage_pct,
            "images_ok": game_ok,
            "http_checked": checked,
            "http_reachable": reachable,
            "http_ok": http_ok,
            "broken_samples": broken_samples,
        }

    return {"images_ok": all_ok, "games": by_game}


async def audit_game_set_coverage(session: AsyncSession, game_code: str) -> dict[str, Any]:
    code = game_code.upper()
    expected_sets = await fetch_source_sets(code)
    expected_codes = [s["code"] for s in expected_sets]
    expected_lookup = {s["code"]: s for s in expected_sets}

    db_codes = await _db_set_codes(session, code)
    card_counts = await _db_set_card_counts(session, code)

    missing: list[dict[str, Any]] = []
    empty: list[dict[str, Any]] = []
    metadata_only: list[dict[str, Any]] = []
    source_gap: list[dict[str, Any]] = []
    sync_gap: list[dict[str, Any]] = []

    for set_code in expected_codes:
        meta = expected_lookup[set_code]
        entry = {
            "code": set_code,
            "name": meta.get("name"),
            "release_date": meta.get("release_date"),
            "expected_cards": meta.get("card_count"),
        }
        if set_code not in db_codes:
            missing.append(entry)
        elif card_counts.get(set_code, 0) == 0:
            empty.append(entry)
            source_cards = await _source_set_card_count(code, set_code)
            kind = _classify_empty_set(code, set_code, meta, source_cards=source_cards)
            if kind == "metadata_only":
                metadata_only.append(entry)
            elif kind == "source_gap":
                source_gap.append(entry)
            else:
                sync_gap.append(entry)

    extra = sorted(db_codes - set(expected_codes))
    synced = len(expected_codes) - len(missing)
    blocking_empty = len(sync_gap)
    in_sync = len(missing) == 0 and blocking_empty == 0

    return {
        "game": code,
        "expected": len(expected_codes),
        "synced": synced,
        "in_sync": in_sync,
        "first_set": expected_codes[0] if expected_codes else None,
        "latest_set": expected_codes[-1] if expected_codes else None,
        "missing": missing,
        "empty": empty,
        "metadata_only": metadata_only,
        "source_gap": source_gap,
        "sync_gap": sync_gap,
        "extra_in_db": extra,
    }


async def verify_set_coverage(
    session: AsyncSession,
    *,
    games: tuple[str, ...] | None = None,
) -> dict[str, Any]:
    targets = games or SET_COVERAGE_GAMES
    by_game: dict[str, Any] = {}
    all_in_sync = True

    for game in targets:
        report = await audit_game_set_coverage(session, game)
        by_game[game] = report
        if not report["in_sync"]:
            all_in_sync = False

    return {
        "in_sync": all_in_sync,
        "games": by_game,
    }
