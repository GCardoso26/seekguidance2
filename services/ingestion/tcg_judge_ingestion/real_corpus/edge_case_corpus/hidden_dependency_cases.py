"""Dependências ocultas (timing)."""

from __future__ import annotations


def hidden_dependency_hint(has_implicit: bool) -> dict[str, str]:
    return {
        "flag": "hidden_dependency" if has_implicit else "none",
        "assistant_guidance": "Liste dependências implícitas antes de avançar o passo.",
    }
