"""Valida API de coleções (Judge + fontes externas) e filtro por set."""

from __future__ import annotations

import asyncio
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request

_API_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "services", "api"))
if _API_ROOT not in sys.path:
    sys.path.insert(0, _API_ROOT)

BASE = sys.argv[1] if len(sys.argv) > 1 else "https://judgetcg.com.br"

GAMES = [
    "MTG",
    "POKEMON",
    "YGO",
    "LORCANA",
    "ONEPIECE",
    "FAB",
    "DIGIMON",
    "SWU",
    "RIFTBOUND",
    "SORCERY",
    "UARENA",
    "DBFW",
    "VANGUARD",
]

# Jogos com set_code predominantemente minúsculo no banco (Scryfall/apitcg/Sorcery)
LOWERCASE_SET_GAMES = frozenset({"MTG", "SORCERY", "DBFW", "UARENA"})


def fetch_json(path: str) -> dict:
    url = f"{BASE}{path}"
    req = urllib.request.Request(url, headers={"Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=45) as res:
        return json.loads(res.read().decode())


def card_set_codes(cards: list[dict]) -> list[str]:
    return [str((c.get("set") or {}).get("code") or "") for c in cards if c.get("set")]


async def validate_external_sources() -> list[dict]:
    from app.tcg_adapters.set_sources import SOURCE_SET_FETCHERS

    rows: list[dict] = []
    for game, fetcher in sorted(SOURCE_SET_FETCHERS.items()):
        row = {"game": game, "external_api": "?", "external_sets": 0, "notes": []}
        try:
            import httpx

            async with httpx.AsyncClient(timeout=60.0) as client:
                sets = await fetcher(client)
            row["external_api"] = "ok"
            row["external_sets"] = len(sets)
            if not sets:
                row["notes"].append("external_empty")
        except Exception as exc:
            row["external_api"] = f"err: {exc}"
            row["notes"].append("external_failed")
        rows.append(row)
    return rows


def validate_judge_api() -> tuple[list[dict], int]:
    rows: list[dict] = []
    failures = 0

    for game in GAMES:
        row: dict = {
            "game": game,
            "catalog_count": 0,
            "sets_count": 0,
            "sets_api": "?",
            "sample_set": None,
            "set_search_total": None,
            "set_search_ok": False,
            "lowercase_sets": False,
            "notes": [],
        }

        try:
            health = fetch_json("/api/catalog/health")
            row["catalog_count"] = int((health.get("by_game") or {}).get(game, 0))
        except Exception as exc:
            row["notes"].append(f"health_err: {exc}")

        try:
            sets_data = fetch_json(f"/api/catalog/sets?game={urllib.parse.quote(game)}")
            sets_list = sets_data.get("sets") or []
            row["sets_api"] = "ok"
            row["sets_count"] = len(sets_list)
            if sets_list:
                best = max(sets_list, key=lambda s: int(s.get("cardCount") or 0))
                row["sample_set"] = {
                    "code": best.get("code"),
                    "name": best.get("name"),
                    "cardCount": best.get("cardCount"),
                }
        except urllib.error.HTTPError as exc:
            row["sets_api"] = f"HTTP {exc.code}"
            row["notes"].append("sets_endpoint_failed")
            failures += 1
        except Exception as exc:
            row["sets_api"] = f"err: {exc}"
            failures += 1

        try:
            sample_cards = fetch_json(
                f"/api/catalog/cards/search?game={urllib.parse.quote(game)}&page=1&limit=24"
            )
            codes = card_set_codes(sample_cards.get("cards") or [])
            row["lowercase_sets"] = any(c and c != c.upper() for c in codes)
        except Exception:
            pass

        sample = row.get("sample_set")
        if sample and sample.get("code"):
            code = sample["code"]
            expected = int(sample.get("cardCount") or 0)
            try:
                search = fetch_json(
                    f"/api/catalog/cards/search?game={urllib.parse.quote(game)}"
                    f"&set={urllib.parse.quote(str(code))}&page=1&limit=5"
                )
                total = int(search.get("total") or 0)
                row["set_search_total"] = total
                row["set_search_ok"] = total > 0
                if expected > 0 and total == 0:
                    if row["lowercase_sets"] or game in LOWERCASE_SET_GAMES:
                        row["notes"].append("LIKELY_CASE_SENSITIVITY_BUG")
                    elif str(code).lower() in {"none", "null"}:
                        row["notes"].append("DATA_QUALITY_SET_CODE_NONE")
                    else:
                        row["notes"].append(f"SET_FILTER_BROKEN expected~{expected} code={code!r}")
                    failures += 1
            except Exception as exc:
                row["notes"].append(f"search_err: {exc}")
                failures += 1
        elif row["catalog_count"] > 0:
            row["notes"].append("no_sets_in_api_but_has_cards")
            failures += 1

        rows.append(row)

    return rows, failures


def main() -> int:
    print(f"Base Judge API: {BASE}\n")

    print("=== Fontes externas de coleções (set_sources.py) ===")
    ext_rows = asyncio.run(validate_external_sources())
    ext_failures = sum(1 for r in ext_rows if r["external_api"] != "ok" or not r["external_sets"])
    for r in ext_rows:
        status = "OK" if r["external_api"] == "ok" and r["external_sets"] else "FAIL"
        print(
            f"{r['game']:<12} {r['external_sets']:>5} sets  {r['external_api']:<12} {status:>4}  "
            f"{'; '.join(r['notes'])}"
        )
    print()

    print("=== Judge API (/api/catalog/sets + search?set=) ===")
    judge_rows, judge_failures = validate_judge_api()
    print(f"{'GAME':<12} {'CARDS':>8} {'SETS':>6} {'LOWER':>6} {'SEARCH':>8}  SAMPLE / NOTES")
    print("-" * 110)
    for r in judge_rows:
        sample = r.get("sample_set")
        sample_str = f"{sample['code']} ({sample['cardCount']})" if sample else "-"
        search = r["set_search_total"] if r["set_search_total"] is not None else "-"
        ok = "OK" if r["set_search_ok"] else "FAIL" if r["set_search_total"] == 0 else "?"
        lower = "yes" if r["lowercase_sets"] else "no"
        notes = "; ".join(r["notes"])
        print(
            f"{r['game']:<12} {r['catalog_count']:>8} {r['sets_count']:>6} {lower:>6} {search!s:>8} {ok:>4}  "
            f"{sample_str}  {notes}"
        )

    total_failures = ext_failures + judge_failures
    print(f"\nExternal API issues: {ext_failures}")
    print(f"Judge set-filter issues: {judge_failures}")
    print(f"Total failures: {total_failures}")
    return 1 if total_failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
