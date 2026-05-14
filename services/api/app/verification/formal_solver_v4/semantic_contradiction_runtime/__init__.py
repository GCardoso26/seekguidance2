"""Contradições semânticas em runtime."""

from __future__ import annotations

from typing import Any

from app.verification.formal_solver_v3.paradox_detection.paradox_v3 import paradox_certificate


def semantic_contradiction_stub(flags: dict[str, bool]) -> dict[str, Any]:
    active = sum(1 for v in flags.values() if v)
    return paradox_certificate(active > 1)
