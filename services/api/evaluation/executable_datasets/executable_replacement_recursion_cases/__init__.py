"""Replacement recursion — casos executáveis."""

from __future__ import annotations

from typing import Any


def executable_replacement_recursion_stub(depth: int, cap: int) -> dict[str, Any]:
    return {"depth": depth, "cap": cap, "within_cap": depth <= cap}
