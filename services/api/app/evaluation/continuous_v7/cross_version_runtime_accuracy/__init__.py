"""Precisão runtime cross-version."""

from __future__ import annotations

from typing import Any


def cross_version_runtime_accuracy_stub(v1: float, v2: float) -> dict[str, Any]:
    return {"delta": abs(v2 - v1), "assistant_notes": ["Temporal legality e policy deltas."]}
