"""Análise de caminhos semânticos."""

from __future__ import annotations


def semantic_paths(rule_id: str, deps: list[str], cap: int = 32) -> list[str]:
    out = [f"{rule_id}->{d}" for d in deps]
    return out[:cap]
