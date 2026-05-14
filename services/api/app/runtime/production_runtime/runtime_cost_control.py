"""Controlo de custo de runtime."""

from __future__ import annotations


def runtime_cost_hint(tokens: int, budget: int) -> dict[str, object]:
    return {"over_budget": tokens > budget, "tokens": tokens, "budget": budget}
