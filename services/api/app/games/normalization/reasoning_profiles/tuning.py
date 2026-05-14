"""Perfis de retrieval/reasoning por jogo (pesos conservadores)."""

from __future__ import annotations

from typing import Any


def retrieval_tuning(game_slug: str) -> dict[str, Any]:
    g = game_slug.lower()
    base = {"vector_weight_scale": 1.0, "lexical_weight_scale": 1.0, "graph_scale": 1.0}
    if g == "yugioh":
        return {**base, "lexical_weight_scale": 1.08, "notes": "SEGOC / chain wording → lexical boost leve"}
    if g == "pokemon":
        return {**base, "vector_weight_scale": 1.05, "notes": "wording determinístico simples"}
    if g == "fab":
        return {**base, "graph_scale": 1.06, "notes": "combat chain graph expansion"}
    return {**base, "notes": "default"}
