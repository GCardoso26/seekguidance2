"""Indexação Meilisearch para busca de cartas (<200ms)."""

from __future__ import annotations

import os
from typing import Any

import httpx
import structlog

logger = structlog.get_logger(__name__)

INDEX_NAME = "cards"


def meili_enabled() -> bool:
    return bool(os.getenv("MEILI_HOST", "").strip())


def _headers() -> dict[str, str]:
    key = os.getenv("MEILI_MASTER_KEY", "")
    h: dict[str, str] = {"Content-Type": "application/json"}
    if key:
        h["Authorization"] = f"Bearer {key}"
    return h


async def ensure_index() -> None:
    if not meili_enabled():
        return
    host = os.getenv("MEILI_HOST", "").rstrip("/")
    async with httpx.AsyncClient(timeout=30.0) as client:
        await client.post(
            f"{host}/indexes",
            headers=_headers(),
            json={"uid": INDEX_NAME, "primaryKey": "id"},
        )
        await client.patch(
            f"{host}/indexes/{INDEX_NAME}/settings",
            headers=_headers(),
            json={
                "searchableAttributes": [
                    "name",
                    "nameNormalized",
                    "set",
                    "set_name",
                    "setCode",
                    "text",
                    "game",
                    "card_type",
                    "game_data.text",
                    "game_data.illustrator",
                ],
                "filterableAttributes": [
                    "game",
                    "game_slug",
                    "rarity",
                    "setCode",
                    "set_name",
                    "language",
                    "card_type",
                    "legalities.standard",
                    "legalities.modern",
                    "legalities.commander",
                    "game_data.domains",
                    "game_data.element",
                    "game_data.clan",
                    "game_data.grade",
                    "game_data.series",
                    "game_data.era",
                ],
                "sortableAttributes": ["name"],
                "rankingRules": ["words", "typo", "proximity", "attribute", "sort", "exactness"],
                "synonyms": {
                    "mtg": ["magic", "magic the gathering"],
                    "ygo": ["yu-gi-oh", "yugioh"],
                    "pokemon": ["pokémon", "pkm"],
                },
            },
        )


async def index_cards(documents: list[dict[str, Any]]) -> dict[str, Any]:
    if not documents:
        return {"indexed": 0, "status": "skipped"}
    if not meili_enabled():
        logger.info("meilisearch_disabled", count=len(documents))
        return {"indexed": 0, "status": "disabled"}

    host = os.getenv("MEILI_HOST", "").rstrip("/")
    await ensure_index()
    async with httpx.AsyncClient(timeout=120.0) as client:
        res = await client.post(
            f"{host}/indexes/{INDEX_NAME}/documents",
            headers=_headers(),
            json=documents,
        )
        if not res.is_success:
            logger.warning("meilisearch_index_failed", status=res.status_code, body=res.text[:200])
            return {"indexed": 0, "status": "error", "detail": res.text[:200]}
        data = res.json()
        return {"indexed": len(documents), "status": "ok", "taskUid": data.get("taskUid")}


async def meili_health_ok() -> bool:
    if not meili_enabled():
        return False
    host = os.getenv("MEILI_HOST", "").rstrip("/")
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            res = await client.get(f"{host}/health", headers=_headers())
            if not res.is_success:
                return False
            data = res.json()
            return data.get("status") == "available"
    except Exception:
        return False


async def search_meili(
    query: str,
    *,
    game: str | None = None,
    limit: int = 20,
) -> list[dict[str, Any]]:
    if not meili_enabled() or not query.strip():
        return []
    if not await meili_health_ok():
        logger.warning("meilisearch_unavailable_fallback_postgres")
        return []
    host = os.getenv("MEILI_HOST", "").rstrip("/")
    params: dict[str, Any] = {"q": query, "limit": limit}
    if game:
        params["filter"] = f'game = "{game.upper()}"'
    async with httpx.AsyncClient(timeout=10.0) as client:
        res = await client.post(
            f"{host}/indexes/{INDEX_NAME}/search",
            headers=_headers(),
            json=params,
        )
        if not res.is_success:
            return []
        return list(res.json().get("hits") or [])
