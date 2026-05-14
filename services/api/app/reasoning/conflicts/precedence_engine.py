"""Precedência simbólica fixa (bounded) — ordem de aplicação de famílias de efeito."""

from __future__ import annotations

from app.games.reasoning_registry import get_precedence_order


def resolve_precedence_chain(game_slug: str, interaction_tags: list[str]) -> list[str]:
    base = list(get_precedence_order(game_slug))
    known = [t for t in interaction_tags if t in base]
    unknown = [t for t in interaction_tags if t not in base]
    rest = [t for t in base if t not in known]
    return known + rest + unknown
