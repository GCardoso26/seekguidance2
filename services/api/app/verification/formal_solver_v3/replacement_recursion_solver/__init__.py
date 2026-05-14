"""Recursão replacement — payload jogável."""

from __future__ import annotations

from typing import Any

from app.verification.formal_solver_v2.replacement_loop_solver import replacement_loop_assistant


def replacement_recursion_payload(effects: list[str]) -> dict[str, Any]:
    return replacement_loop_assistant(effects)
