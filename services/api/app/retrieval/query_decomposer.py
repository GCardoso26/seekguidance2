"""
Decomposição de perguntas complexas para retrieval paralelo.

Detecta quando uma pergunta menciona múltiplas mecânicas ou palavras-chave
de regras e decompõe em sub-queries independentes.

Exemplo:
  Input: "Como Trample interage com Deathtouch?"
  Sub-queries: ["Como funciona Trample?", "Como funciona Deathtouch?", pergunta original]

Retrieval paralelo por sub-query + fusão RRF dos chunks resultantes.
"""

from __future__ import annotations

import asyncio
import logging
from collections.abc import Awaitable, Callable
from typing import Any

logger = logging.getLogger(__name__)

MECHANIC_KEYWORDS: dict[str, list[str]] = {
    "mtg": [
        "trample",
        "deathtouch",
        "first strike",
        "double strike",
        "flying",
        "reach",
        "vigilance",
        "lifelink",
        "hexproof",
        "shroud",
        "protection",
        "regenerate",
        "indestructible",
        "flash",
        "haste",
        "menace",
    ],
    "yugioh": [
        "chain",
        "spell speed",
        "quick effect",
        "trigger effect",
        "continuous effect",
        "negate",
        "destroy",
        "banish",
        "graveyard",
        "special summon",
    ],
    "pokemon": [
        "burn",
        "poison",
        "paralysis",
        "sleep",
        "confusion",
        "bench",
        "evolve",
        "ability",
        "attack",
        "weakness",
        "resistance",
    ],
}

GAME_DISPLAY = {
    "mtg": "Magic: The Gathering",
    "yugioh": "Yu-Gi-Oh!",
    "pokemon": "Pokémon TCG",
}


def detect_mechanics(question: str, game_slug: str) -> list[str]:
    """Retorna lista de mecânicas detectadas na pergunta."""
    keywords = MECHANIC_KEYWORDS.get(game_slug.strip().lower(), [])
    question_lower = question.lower()
    return [kw for kw in keywords if kw in question_lower]


def should_decompose(question: str, game_slug: str) -> bool:
    """True se a pergunta menciona 2+ mecânicas distintas."""
    return len(detect_mechanics(question, game_slug)) >= 2


def build_sub_queries(question: str, mechanics: list[str], game_slug: str) -> list[str]:
    """Gera sub-queries: uma por mecânica + a pergunta de interação."""
    game = GAME_DISPLAY.get(game_slug.strip().lower(), "TCG")
    sub_queries = [f"Como funciona {mech} em {game}?" for mech in mechanics]
    sub_queries.append(question)
    return sub_queries


def _merge_result_lists(lists: list[list[Any]]) -> list[Any]:
    """Fusão RRF para listas de UUID ou objetos genéricos."""
    from uuid import UUID

    if lists and all(
        isinstance(x, UUID) for lst in lists for x in lst if lst
    ):
        from app.retrieval.fusion import weighted_rrf_merge_two_lists

        merged: list[Any] = lists[0]
        for result_list in lists[1:]:
            merged = weighted_rrf_merge_two_lists(merged, result_list, weight_b=0.5)
        return merged

    seen: dict[str, Any] = {}
    scores: dict[str, float] = {}
    for lst in lists:
        for rank, item in enumerate(lst):
            if isinstance(item, dict):
                key = str(item.get("id") or item.get("chunk_id") or rank)
            else:
                key = str(getattr(item, "chunk_id", None) or item)
            scores[key] = scores.get(key, 0.0) + 1.0 / (60 + rank + 1)
            seen[key] = item
    return [seen[k] for k in sorted(scores, key=lambda k: -scores[k])]


async def decompose_and_retrieve(
    question: str,
    game_slug: str,
    retrieve_fn: Callable[[str, str], Awaitable[list[Any]]],
    top_k: int = 5,
    *,
    enabled: bool = True,
) -> list[Any]:
    """
    Retrieval paralelo por sub-query com fusão RRF.
    Retorna lista deduplicada e ordenada por relevância agregada.
    """
    if not enabled or not should_decompose(question, game_slug):
        return await retrieve_fn(question, game_slug)

    mechanics = detect_mechanics(question, game_slug)
    sub_queries = build_sub_queries(question, mechanics, game_slug)
    logger.debug("Decomposição: %d sub-queries para '%s...'", len(sub_queries), question[:50])

    results = await asyncio.gather(
        *[retrieve_fn(q, game_slug) for q in sub_queries],
        return_exceptions=True,
    )
    valid_results = [r for r in results if isinstance(r, list)]

    if not valid_results:
        logger.warning("Todas as sub-queries falharam, usando query original")
        return await retrieve_fn(question, game_slug)

    merged = _merge_result_lists(valid_results)

    return merged[:top_k]
