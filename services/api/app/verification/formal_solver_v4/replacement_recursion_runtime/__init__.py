"""Replacement recursivo com limite."""

from __future__ import annotations

from typing import Any

from app.verification.formal_solver_v3.replacement_recursion_solver import replacement_recursion_payload


def replacement_recursion_bounded(effects: list[str], *, cap: int) -> dict[str, Any]:
    p = replacement_recursion_payload(effects[:cap])
    return {**p, "cap": cap}
