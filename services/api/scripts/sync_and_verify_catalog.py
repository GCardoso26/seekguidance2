"""Aplica migration de catálogo, sync por jogo e checklist de endpoints."""

from __future__ import annotations

import asyncio
import json
import os
import sys
import time
from pathlib import Path
from typing import Any

import httpx

_API_ROOT = Path(__file__).resolve().parents[1]
if str(_API_ROOT) not in sys.path:
    sys.path.insert(0, str(_API_ROOT))

from sqlalchemy import text

from app.catalog.games_service import list_merged_catalog_sets
from app.catalog.pipeline import run_game_sync
from app.catalog.search_service import search_catalog_cards
from app.infrastructure.db.session import get_session_factory

MIGRATION = (
    _API_ROOT.parents[1] / "supabase" / "migrations" / "20260706140000_catalog_sets_images_fix.sql"
)

PRIORITY_GAMES = ["POKEMON", "MTG", "ONEPIECE", "YGO", "LORCANA"]

MIN_SETS: dict[str, list[str]] = {
    "POKEMON": ["sv3pt5", "sv3", "sv8"],
    "MTG": ["blb", "fdn"],
    "ONEPIECE": [f"OP-{i:02d}" for i in range(1, 16)],
    "YGO": ["RA01", "LEDE"],
    "LORCANA": ["TFC", "ROF", "ITI", "URS", "SSK", "AZS", "ARI", "ROJ", "FAB", "AOV"],
}

SLUG_BY_GAME = {
    "POKEMON": "pokemon",
    "MTG": "mtg",
    "ONEPIECE": "onepiece",
    "YGO": "yugioh",
    "LORCANA": "lorcana",
}


async def apply_migration(session) -> dict[str, Any]:
    if not MIGRATION.exists():
        return {"status": "skipped", "reason": "migration file missing"}

    sql = MIGRATION.read_text(encoding="utf-8")
    # Remove comentários de linha e executa statement a statement
    statements: list[str] = []
    buf: list[str] = []
    for line in sql.splitlines():
        stripped = line.strip()
        if stripped.startswith("--"):
            continue
        buf.append(line)
        if stripped.endswith(";"):
            statements.append("\n".join(buf).strip())
            buf = []

    applied = 0
    for stmt in statements:
        if not stmt:
            continue
        await session.execute(text(stmt))
        applied += 1
    await session.commit()
    return {"status": "ok", "statements": applied}


async def run_syncs(games: list[str], *, full: bool = False) -> list[dict[str, Any]]:
    results: list[dict[str, Any]] = []
    factory = get_session_factory()
    for game in games:
        started = time.perf_counter()
        print(f"\n=== SYNC {game} (full={full}) ===", flush=True)
        async with factory() as session:
            try:
                result = await run_game_sync(session, game, full=full)
                await session.commit()
                elapsed = round(time.perf_counter() - started, 1)
                row = {"game": game, "status": result.get("status", "ok"), "elapsed_s": elapsed, **result}
                print(json.dumps({k: row[k] for k in row if k not in {"index"}}, default=str), flush=True)
                results.append(row)
            except Exception as exc:
                await session.rollback()
                elapsed = round(time.perf_counter() - started, 1)
                err = {"game": game, "status": "error", "message": str(exc), "elapsed_s": elapsed}
                print(json.dumps(err), flush=True)
                results.append(err)
    return results


async def verify_db_minimums() -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    factory = get_session_factory()
    async with factory() as session:
        for game, required in MIN_SETS.items():
            sets = await list_merged_catalog_sets(session, game=game, limit=500)
            names = {str(s["code"]).lower(): str(s["name"]) for s in sets}
            missing = [code for code in required if code.lower() not in names]
            rows.append(
                {
                    "game": game,
                    "sets_total": len(sets),
                    "required": len(required),
                    "missing": missing,
                    "ok": not missing,
                }
            )

        img_row = (
            await session.execute(
                text(
                    """
                    SELECT
                      COUNT(*) FILTER (WHERE image_url IS NOT NULL AND image_url <> '') AS with_url,
                      COUNT(*) FILTER (
                        WHERE image_uris IS NOT NULL
                          AND image_uris <> '{}'::jsonb
                          AND COALESCE(image_uris->>'normal', '') <> ''
                      ) AS with_uris,
                      COUNT(*) AS total
                    FROM tcg_judge.card_catalog
                    WHERE game_code = ANY(:games)
                    """
                ),
                {"games": PRIORITY_GAMES},
            )
        ).mappings().first()
    return rows, dict(img_row or {})


async def verify_service_layer() -> list[dict[str, Any]]:
    checks: list[dict[str, Any]] = []
    factory = get_session_factory()
    async with factory() as session:
        for game in PRIORITY_GAMES:
            search = await search_catalog_cards(session, game=game, limit=5, page=1)
            cards = search.get("cards") or []
            with_image = sum(
                1
                for c in cards
                if (c.get("imageUris") or {}).get("normal") or c.get("image_url")
            )
            checks.append(
                {
                    "layer": "service",
                    "game": game,
                    "cards_sampled": len(cards),
                    "with_image": with_image,
                    "ok": len(cards) > 0 and with_image > 0,
                }
            )
    return checks


async def verify_http(base_url: str) -> list[dict[str, Any]]:
    base = base_url.rstrip("/")
    rows: list[dict[str, Any]] = []

    async def hit(method: str, path: str, **kwargs) -> tuple[int, Any]:
        async with httpx.AsyncClient(timeout=60.0) as client:
            res = await client.request(method, f"{base}{path}", **kwargs)
            try:
                body = res.json()
            except Exception:
                body = res.text[:300]
            return res.status_code, body

    endpoints = [
        ("GET", "/runtime/judge/catalog/health", {}),
        ("GET", "/runtime/judge/catalog/games", {}),
    ]
    for game in PRIORITY_GAMES:
        slug = SLUG_BY_GAME[game]
        endpoints.extend(
            [
                ("GET", f"/runtime/judge/catalog/sets?game={game}&limit=200", {}),
                ("GET", f"/runtime/judge/catalog/games/{slug}/sets", {}),
                ("GET", f"/runtime/judge/catalog/games/{slug}", {}),
                ("GET", f"/runtime/judge/catalog/cards/search?game={game}&limit=5&page=1", {}),
            ]
        )

    for method, path, opts in endpoints:
        code, body = await hit(method, path, **opts)
        ok = code == 200
        detail: dict[str, Any] = {"endpoint": f"{method} {path}", "status": code, "ok": ok}
        if ok and isinstance(body, dict):
            if "sets" in body:
                detail["sets_count"] = len(body.get("sets") or [])
            if "cards" in body:
                cards = body.get("cards") or []
                detail["cards_count"] = len(cards)
                detail["images_ok"] = sum(
                    1 for c in cards if (c.get("imageUris") or {}).get("normal") or c.get("image_url")
                )
            if "by_game" in body:
                detail["by_game"] = body.get("by_game")
        else:
            detail["body"] = body
        rows.append(detail)
        mark = "OK" if ok else "FAIL"
        print(f"[HTTP {mark}] {code} {method} {path}", flush=True)

    # Card detail + versions (first card from search)
    for game in PRIORITY_GAMES:
        code, body = await hit("GET", f"/runtime/judge/catalog/cards/search?game={game}&limit=1&page=1")
        if code != 200 or not isinstance(body, dict):
            rows.append({"endpoint": f"GET card detail {game}", "status": code, "ok": False})
            continue
        cards = body.get("cards") or []
        if not cards:
            rows.append({"endpoint": f"GET card detail {game}", "status": "no_cards", "ok": False})
            continue
        card_id = cards[0]["id"]
        for suffix in ("", "/versions"):
            path = f"/runtime/judge/catalog/cards/{card_id}{suffix}"
            c2, b2 = await hit("GET", path)
            ok = c2 == 200
            row = {"endpoint": f"GET {path}", "status": c2, "ok": ok}
            if ok and suffix == "" and isinstance(b2, dict):
                card = b2.get("card") or b2
                uris = card.get("imageUris") or {}
                row["has_image"] = bool(uris.get("normal") or card.get("image_url"))
            rows.append(row)
            print(f"[HTTP {'OK' if ok else 'FAIL'}] {c2} GET {path}", flush=True)

    return rows


async def main() -> int:
    api_base = os.getenv("VERIFY_API_BASE", "http://127.0.0.1:8000")
    full = os.getenv("CATALOG_SYNC_FULL", "false").lower() in ("1", "true", "yes")

    print("=== 1) Migration ===", flush=True)
    factory = get_session_factory()
    async with factory() as session:
        mig = await apply_migration(session)
    print(json.dumps(mig), flush=True)

    print("\n=== 2) Sync por jogo ===", flush=True)
    sync_results = await run_syncs(PRIORITY_GAMES, full=full)

    print("\n=== 3) DB — sets mínimos + imagens ===", flush=True)
    set_rows, img_stats = await verify_db_minimums()
    for row in set_rows:
        mark = "OK" if row["ok"] else "FAIL"
        print(
            f"[DB {mark}] {row['game']}: sets={row['sets_total']} missing={row['missing']}",
            flush=True,
        )
    print(json.dumps({"image_stats": img_stats}, default=str), flush=True)

    print("\n=== 4) Service layer ===", flush=True)
    service_rows = await verify_service_layer()
    for row in service_rows:
        mark = "OK" if row["ok"] else "FAIL"
        print(
            f"[SVC {mark}] {row['game']}: sampled={row['cards_sampled']} images={row['with_image']}",
            flush=True,
        )

    print(f"\n=== 5) HTTP checklist ({api_base}) ===", flush=True)
    http_rows = await verify_http(api_base)

    report = {
        "migration": mig,
        "sync": sync_results,
        "db_sets": set_rows,
        "image_stats": img_stats,
        "service": service_rows,
        "http": http_rows,
    }
    out = _API_ROOT / "scripts" / "catalog_sync_verify_report.json"
    out.write_text(json.dumps(report, indent=2, default=str), encoding="utf-8")
    print(f"\nRelatório salvo em: {out}", flush=True)

    failures = 0
    failures += sum(1 for r in set_rows if not r["ok"])
    failures += sum(1 for r in service_rows if not r["ok"])
    failures += sum(1 for r in http_rows if not r.get("ok"))
    failures += sum(1 for r in sync_results if r.get("status") == "error")
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
