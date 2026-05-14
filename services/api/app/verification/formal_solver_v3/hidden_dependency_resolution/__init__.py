"""Dependências ocultas — hints para o assistente."""

from __future__ import annotations

from typing import Any


def hidden_dependency_hints(edges: list[tuple[str, str]]) -> dict[str, Any]:
    return {
        "edges": edges,
        "assistant_note": "Liste dependências implícitas antes de resolver o próximo passo.",
    }
