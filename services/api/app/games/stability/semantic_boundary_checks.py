"""Verificações de fronteira semântica (flags conservadores)."""

from __future__ import annotations

from typing import Any


def boundary_violation_flags(
    *,
    universal_term: str,
    game_specific_terms: list[str],
) -> dict[str, Any]:
    """Sinaliza risco se um termo universal for mapeado a muitos termos locais sem contexto."""
    overload = len(game_specific_terms) > 6
    return {
        "universal_term": universal_term,
        "overload": overload,
        "game_specific_count": len(game_specific_terms),
    }
