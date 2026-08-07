"""Listas canónicas de coleções por TCG (fontes oficiais)."""

from __future__ import annotations

import os
from typing import Any

import httpx

OPTCG_SETS = "https://optcgapi.com/api/allSets/"
LORCANA_SETS = "https://api.lorcana-api.com/bulk/sets"
FAB_SET_JSON = (
    "https://raw.githubusercontent.com/the-fab-cube/flesh-and-blood-cards/v8.1.0/json/english/set.json"
)
TCGDEX_SETS = "https://api.tcgdex.net/v2/en/sets"
POKEMON_API = "https://api.pokemontcg.io/v2"
YGOPRODECK_CARDSETS = "https://db.ygoprodeck.com/api/v7/cardsets.php"
DIGIMON_API = "https://digimoncard.io/api-public"
DIGIMON_SERIES = "Digimon Card Game"
SWU_API = "https://api.swu-db.com"
RIFTSCRIBE_API = "https://riftscribe.gg/api"

SET_COVERAGE_GAMES = (
    "ONEPIECE",
    "LORCANA",
    "FAB",
    "POKEMON",
    "YGO",
    "DIGIMON",
    "SWU",
    "RIFTBOUND",
    "SORCERY",
    "UARENA",
    "DBFW",
    "GUNDAM",
    "VANGUARD",
)

# Coleções sem listagem de cartas na fonte (agregadores, decks vazios, etc.)
METADATA_ONLY_SETS: dict[str, frozenset[str]] = {
    "FAB": frozenset({"1HB", "1HD", "1HK", "1HR", "1HT", "1HV"}),
    "POKEMON": frozenset({"wp", "sp", "rc", "jumbo"}),
}

# Coleções listadas na fonte mas sem cartas disponíveis na API pública
SOURCE_GAP_SETS: dict[str, frozenset[str]] = {
    "LORCANA": frozenset({"QU1"}),
    "YGO": frozenset({"YUCB", "ADC1"}),
    "SWU": frozenset({"TASH", "SOROPJ", "SS2J"}),
}


def _fab_set_release_date(entry: dict[str, Any]) -> str | None:
    for printing in entry.get("printings") or []:
        raw = printing.get("initial_release_date")
        if raw:
            return str(raw)[:10]
    return None


def _onepiece_sort_key(code: str) -> tuple[int, str]:
    digits = code.replace("OP-", "").replace("OP", "")
    try:
        return (int(digits), code)
    except ValueError:
        return (9999, code)


async def fetch_onepiece_sets(client: httpx.AsyncClient) -> list[dict[str, Any]]:
    res = await client.get(OPTCG_SETS)
    res.raise_for_status()
    payload = res.json()
    rows = payload if isinstance(payload, list) else payload.get("data") or []
    sets: list[dict[str, Any]] = []
    for row in rows:
        code = str(row.get("set_id") or row.get("id") or "").strip()
        if not code:
            continue
        sets.append(
            {
                "code": code,
                "name": row.get("set_name") or row.get("name") or code,
                "release_date": row.get("release_date"),
                "sort_key": _onepiece_sort_key(code),
            }
        )
    sets.sort(key=lambda s: s["sort_key"])
    return sets


async def fetch_lorcana_sets(client: httpx.AsyncClient) -> list[dict[str, Any]]:
    res = await client.get(LORCANA_SETS)
    res.raise_for_status()
    rows = res.json()
    sets: list[dict[str, Any]] = []
    for row in rows:
        code = str(row.get("Set_ID") or row.get("set_id") or "").strip()
        if not code:
            continue
        sets.append(
            {
                "code": code,
                "name": row.get("Name") or row.get("name") or code,
                "release_date": row.get("Release_Date"),
                "card_count": row.get("Cards"),
                "sort_key": int(row.get("Set_Num") or 9999),
            }
        )
    sets.sort(key=lambda s: s["sort_key"])
    return sets


async def fetch_fab_sets(client: httpx.AsyncClient) -> list[dict[str, Any]]:
    res = await client.get(FAB_SET_JSON)
    res.raise_for_status()
    rows = res.json()
    sets: list[dict[str, Any]] = []
    for row in rows:
        code = str(row.get("id") or "").strip()
        if not code:
            continue
        release_date = _fab_set_release_date(row)
        sets.append(
            {
                "code": code,
                "name": row.get("name") or code,
                "release_date": release_date,
                "sort_key": release_date or "9999-12-31",
            }
        )
    sets.sort(key=lambda s: (s["sort_key"], s["code"]))
    return sets


async def fetch_pokemon_pokemontcg_sets(client: httpx.AsyncClient) -> list[dict[str, Any]]:
    headers: dict[str, str] = {"Accept": "application/json"}
    key = os.getenv("POKEMON_TCG_API_KEY", "").strip()
    if key:
        headers["X-Api-Key"] = key
    res = await client.get(f"{POKEMON_API}/sets", params={"pageSize": 250}, headers=headers)
    res.raise_for_status()
    rows = res.json().get("data") or []
    sets: list[dict[str, Any]] = []
    for index, row in enumerate(rows):
        code = str(row.get("id") or "").strip()
        if not code:
            continue
        sets.append(
            {
                "code": code,
                "name": row.get("name") or code,
                "release_date": row.get("releaseDate"),
                "card_count": row.get("total"),
                "sort_key": row.get("releaseDate") or f"9999-{index:04d}",
            }
        )
    sets.sort(key=lambda s: s["sort_key"])
    return sets


async def fetch_pokemon_tcgdex_sets(client: httpx.AsyncClient) -> list[dict[str, Any]]:
    res = await client.get(TCGDEX_SETS)
    res.raise_for_status()
    rows = res.json()
    sets: list[dict[str, Any]] = []
    for index, row in enumerate(rows):
        code = str(row.get("id") or "").strip()
        if not code:
            continue
        card_count = row.get("cardCount") or {}
        sets.append(
            {
                "code": code,
                "name": row.get("name") or code,
                "release_date": row.get("releaseDate"),
                "card_count": card_count.get("total") if isinstance(card_count, dict) else None,
                "sort_key": index,
            }
        )
    return sets


async def fetch_pokemon_sets(client: httpx.AsyncClient) -> list[dict[str, Any]]:
    if os.getenv("POKEMON_TCG_API_KEY", "").strip():
        return await fetch_pokemon_pokemontcg_sets(client)
    return await fetch_pokemon_tcgdex_sets(client)


async def fetch_ygo_sets(client: httpx.AsyncClient) -> list[dict[str, Any]]:
    res = await client.get(YGOPRODECK_CARDSETS)
    res.raise_for_status()
    rows = res.json()
    sets: list[dict[str, Any]] = []
    for row in rows:
        code = str(row.get("set_code") or "").strip()
        if not code:
            continue
        sets.append(
            {
                "code": code,
                "name": row.get("set_name") or code,
                "release_date": row.get("tcg_date"),
                "card_count": row.get("num_of_cards"),
                "sort_key": row.get("tcg_date") or "9999-12-31",
            }
        )
    sets.sort(key=lambda s: (s["sort_key"], s["code"]))
    return sets


async def fetch_digimon_sets(client: httpx.AsyncClient) -> list[dict[str, Any]]:
    res = await client.get(
        f"{DIGIMON_API}/getAllCards",
        params={
            "series": DIGIMON_SERIES,
            "sort": "code",
            "sortdirection": "asc",
        },
    )
    res.raise_for_status()
    rows = res.json()
    prefixes: dict[str, str] = {}
    for row in rows:
        cid = str(row.get("cardnumber") or row.get("id") or "").strip()
        if "-" not in cid:
            continue
        code = cid.split("-", 1)[0]
        prefixes.setdefault(code, code)
    return [
        {"code": code, "name": name, "sort_key": code}
        for code, name in sorted(prefixes.items())
    ]


def _parse_swu_date(value: str | None) -> str | None:
    if not value:
        return None
    parts = value.split("/")
    if len(parts) == 3:
        month, day, year = parts
        if len(year) == 2:
            year = f"20{year}"
        return f"{year}-{month.zfill(2)}-{day.zfill(2)}"
    return value[:10] if len(value) >= 10 else None


async def fetch_swu_sets(client: httpx.AsyncClient) -> list[dict[str, Any]]:
    res = await client.get(f"{SWU_API}/sets")
    res.raise_for_status()
    rows = res.json()
    sets: list[dict[str, Any]] = []
    for row in rows:
        code = str(row.get("setId") or "").strip()
        if not code:
            continue
        release_date = _parse_swu_date(row.get("releaseDate"))
        sets.append(
            {
                "code": code,
                "name": row.get("fullName") or code,
                "release_date": release_date,
                "card_count": row.get("numberCards"),
                "sort_key": release_date or code,
            }
        )
    sets.sort(key=lambda s: (s["sort_key"], s["code"]))
    return sets


async def fetch_riftbound_sets(client: httpx.AsyncClient) -> list[dict[str, Any]]:
    res = await client.get(f"{RIFTSCRIBE_API}/cards/filters")
    res.raise_for_status()
    payload = res.json()
    set_codes = payload.get("sets") if isinstance(payload, dict) else []
    return [
        {"code": str(code), "name": str(code), "sort_key": str(code)}
        for code in set_codes or []
        if code
    ]


async def fetch_sorcery_sets(client: httpx.AsyncClient) -> list[dict[str, Any]]:
    res = await client.get("https://api.sorcerytcg.com/api/cards")
    res.raise_for_status()
    cards = res.json()
    sets: dict[str, str] = {}
    for card in cards:
        if not isinstance(card, dict):
            continue
        for set_entry in card.get("sets") or []:
            if not isinstance(set_entry, dict):
                continue
            name = str(set_entry.get("name") or "Unknown")
            code = name.lower().replace(" ", "-")[:20]
            sets[code] = name
    return [{"code": c, "name": n, "sort_key": c} for c, n in sorted(sets.items())]


async def _apitcg_set_codes(client: httpx.AsyncClient, repo: str) -> list[dict[str, Any]]:
    res = await client.get(f"https://api.github.com/repos/apitcg/{repo}/contents/cards/en")
    if not res.is_success:
        return []
    files = res.json()
    if not isinstance(files, list):
        return []
    sets: list[dict[str, Any]] = []
    for item in files:
        if not isinstance(item, dict) or not str(item.get("name", "")).endswith(".json"):
            continue
        code = str(item["name"]).replace(".json", "")
        sets.append({"code": code, "name": code.upper(), "sort_key": code})
    return sets


async def fetch_union_arena_sets(client: httpx.AsyncClient) -> list[dict[str, Any]]:
    return await _apitcg_set_codes(client, "union-arena-tcg-data")


async def fetch_dbfw_sets(client: httpx.AsyncClient) -> list[dict[str, Any]]:
    return await _apitcg_set_codes(client, "dragon-ball-fusion-tcg-data")


async def fetch_gundam_sets(client: httpx.AsyncClient) -> list[dict[str, Any]]:
    return await _apitcg_set_codes(client, "gundam-tcg-data")


async def fetch_vanguard_sets(client: httpx.AsyncClient) -> list[dict[str, Any]]:
    from app.infrastructure.external.providers.catalog_resolver import get_catalog_provider_for_game

    for provider in get_catalog_provider_for_game("VANGUARD"):
        sets = await provider.list_sets("VANGUARD")
        if sets:
            return [
                {
                    "code": s.code,
                    "name": s.name,
                    "release_date": s.release_date,
                    "external_id": s.external_id,
                }
                for s in sets
            ]

    res = await client.get(
        "https://tcgcsv.com/tcgplayer/16/groups",
        headers={"User-Agent": "JudgeTCG/1.0 (catalog sync; contact@judgetcg.com.br)"},
    )
    if not res.is_success:
        return []
    rows = res.json().get("results") if isinstance(res.json(), dict) else []
    if not isinstance(rows, list):
        return []
    return [
        {
            "code": str(row.get("abbreviation") or row.get("groupId") or ""),
            "name": row.get("name") or row.get("abbreviation"),
            "release_date": row.get("publishedOn"),
            "external_id": str(row.get("groupId") or ""),
        }
        for row in rows
        if isinstance(row, dict) and row.get("abbreviation")
    ]


SOURCE_SET_FETCHERS = {
    "ONEPIECE": fetch_onepiece_sets,
    "LORCANA": fetch_lorcana_sets,
    "FAB": fetch_fab_sets,
    "POKEMON": fetch_pokemon_sets,
    "YGO": fetch_ygo_sets,
    "DIGIMON": fetch_digimon_sets,
    "SWU": fetch_swu_sets,
    "RIFTBOUND": fetch_riftbound_sets,
    "SORCERY": fetch_sorcery_sets,
    "UARENA": fetch_union_arena_sets,
    "DBFW": fetch_dbfw_sets,
    "GUNDAM": fetch_gundam_sets,
    "VANGUARD": fetch_vanguard_sets,
}


async def fetch_source_sets(game_code: str) -> list[dict[str, Any]]:
    fetcher = SOURCE_SET_FETCHERS.get(game_code.upper())
    if not fetcher:
        return []
    async with httpx.AsyncClient(timeout=90.0) as client:
        return await fetcher(client)
