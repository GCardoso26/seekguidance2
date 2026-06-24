"""Fetch card JSON dumps from apitcg GitHub repositories."""

from __future__ import annotations

from typing import Any

import httpx

GITHUB_API = "https://api.github.com/repos/apitcg"


async def list_json_files(client: httpx.AsyncClient, repo: str, path: str) -> list[dict[str, str]]:
    res = await client.get(f"{GITHUB_API}/{repo}/contents/{path}")
    if not res.is_success:
        return []
    payload = res.json()
    if not isinstance(payload, list):
        return []
    return [
        {"name": item["name"], "url": item["download_url"]}
        for item in payload
        if isinstance(item, dict) and item.get("name", "").endswith(".json") and item.get("download_url")
    ]


async def fetch_json_cards(client: httpx.AsyncClient, url: str) -> list[dict[str, Any]]:
    res = await client.get(url)
    if not res.is_success:
        return []
    payload = res.json()
    if isinstance(payload, list):
        return [row for row in payload if isinstance(row, dict)]
    return []


async def fetch_apitcg_repo_cards(client: httpx.AsyncClient, repo: str, lang: str = "en") -> list[dict[str, Any]]:
    files = await list_json_files(client, repo, f"cards/{lang}")
    cards: list[dict[str, Any]] = []
    for entry in files:
        rows = await fetch_json_cards(client, entry["url"])
        set_code = entry["name"].replace(".json", "")
        for row in rows:
            row.setdefault("_file_set", set_code)
        cards.extend(rows)
    return cards
