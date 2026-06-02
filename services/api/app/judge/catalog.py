"""Catálogo e health do Judge TCG (jogos + corpus indexado)."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from app.core.config import Settings
from app.judge.registry import CANONICAL_TCG_BY_GAME_SLUG, TCG_BETA, TCG_COMING_SOON
from app.retrieval.confidence_profiles import get_confidence_profile
from app.runtime_judge_semantic_cache.cache import cache_stats_snapshot
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

_MIN_CHUNKS_RAG_READY = 1


async def _chunk_stats_by_game(session: AsyncSession) -> dict[str, dict[str, Any]]:
    stmt = text(
        """
        SELECT
            g.slug AS game_slug,
            COUNT(c.id)::int AS chunk_count,
            MAX(d.indexed_at) AS last_indexed_at,
            MAX(c.created_at) AS last_chunk_at
        FROM tcg_judge.games g
        LEFT JOIN tcg_judge.documents d ON d.game_id = g.id
        LEFT JOIN tcg_judge.chunks c ON c.document_id = d.id
        WHERE g.enabled = true
        GROUP BY g.slug
        """
    )
    rows = (await session.execute(stmt)).mappings().all()
    return {str(r["game_slug"]): dict(r) for r in rows}


async def list_judge_games(session: AsyncSession, settings: Settings) -> list[dict[str, Any]]:
    stats = await _chunk_stats_by_game(session)
    allowed = settings.rag_allowed_game_slug_set()
    catalog: list[dict[str, Any]] = []

    for game_slug, canonical in CANONICAL_TCG_BY_GAME_SLUG.items():
        row = stats.get(game_slug, {})
        chunk_count = int(row.get("chunk_count") or 0)
        rag_allowed = game_slug in allowed
        coming_soon = canonical in TCG_COMING_SOON or game_slug in TCG_COMING_SOON
        beta = canonical in TCG_BETA or game_slug in TCG_BETA
        rag_ready = rag_allowed and chunk_count >= _MIN_CHUNKS_RAG_READY and not coming_soon

        conf_profile = get_confidence_profile(game_slug)
        catalog.append(
            {
                "tcg_id": canonical,
                "game_slug": game_slug,
                "display_name": _display_name(canonical, game_slug),
                "enabled": rag_allowed and not coming_soon,
                "coming_soon": coming_soon,
                "beta": beta,
                "rag_ready": rag_ready,
                "chunk_count": chunk_count,
                "last_indexed_at": _iso(row.get("last_indexed_at")),
                "last_chunk_at": _iso(row.get("last_chunk_at")),
                "confidence_notice_threshold": conf_profile.ui_notice_threshold,
            }
        )

    catalog.sort(key=lambda g: g["display_name"])
    return catalog


async def judge_health_payload(session: AsyncSession, settings: Settings) -> dict[str, Any]:
    games = await list_judge_games(session, settings)
    rag_ready_count = sum(1 for g in games if g["rag_ready"])
    db_ok = True
    try:
        await session.execute(text("SELECT 1"))
    except Exception:
        db_ok = False

    openai_configured = bool(settings.openai_api_key)
    status = "ok"
    if not db_ok:
        status = "offline"
    elif not openai_configured or rag_ready_count == 0:
        status = "degraded"

    cache_stats = cache_stats_snapshot()
    from app.retrieval.semantic_cache import hash_cache_stats

    hash_stats = hash_cache_stats()
    provider = settings.semantic_cache_provider
    cache_enabled = settings.semantic_cache_enabled or settings.judge_semantic_cache_enabled

    from app.runtime.runtime_warmup import get_warmup_status

    warmup = get_warmup_status()
    components_ready = sum(
        1
        for key in ("embedding_ready", "reranker_ready", "cache_ready", "judge_ready")
        if warmup.get(key)
    )

    return {
        "status": status,
        "integrity_status": "ok" if db_ok else "degraded",
        "database": "ok" if db_ok else "offline",
        "openai_configured": openai_configured,
        "rag_ready_games": rag_ready_count,
        "total_games": len(games),
        "default_chat_model": settings.default_chat_model,
        "cache_hit_rate": cache_stats.get("cache_hit_rate", 0.0),
        "cache_stats": cache_stats,
        "semantic_cache": {
            "enabled": cache_enabled,
            "provider": provider,
            "hit_rate_1h": hash_stats.get("hit_rate") or cache_stats.get("cache_hit_rate", 0.0),
        },
        "warmup": {
            "completed": warmup.get("completed", False),
            "duration_ms": warmup.get("warmup_duration_ms", 0.0),
            "components_ready": components_ready,
            "components_total": 4,
        },
        "games": games,
    }


def _display_name(tcg_id: str, game_slug: str) -> str:
    names = {
        "magic": "Magic: The Gathering",
        "pokemon": "Pokémon TCG",
        "lorcana": "Disney Lorcana",
        "yugioh": "Yu-Gi-Oh!",
        "one_piece": "One Piece TCG",
        "flesh_and_blood": "Flesh and Blood",
        "gundam": "Gundam Card Game",
        "digimon": "Digimon TCG",
        "dragon_ball": "Dragon Ball Super Fusion World",
        "sorcery": "Sorcery: Contested Realm",
        "vanguard": "Cardfight!! Vanguard",
        "riftbound": "Riftbound — League of Legends",
        "union_arena": "Union Arena",
        "star_wars_unlimited": "Star Wars: Unlimited",
    }
    return names.get(tcg_id, game_slug.replace("_", " ").title())


def _iso(value: Any) -> str | None:
    if value is None:
        return None
    if isinstance(value, datetime):
        return value.isoformat()
    return str(value)
