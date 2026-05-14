"""Estratégias de degradação graciosa."""

from __future__ import annotations


def degradation_strategy(level: str) -> dict[str, str]:
    if level == "hard":
        return {"replay": "reduce_timeline", "graph": "collapse", "semantic": "simplify"}
    if level == "soft":
        return {"replay": "trim_branches", "graph": "tighten_cap", "semantic": "keep"}
    return {"replay": "full", "graph": "full", "semantic": "full"}
