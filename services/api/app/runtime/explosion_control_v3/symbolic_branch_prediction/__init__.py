"""Predição de ramos simbólicos."""

from __future__ import annotations


def symbolic_branch_prediction(n: int, cap: int) -> dict[str, object]:
    return {"over": n > cap, "n": n, "cap": cap}
