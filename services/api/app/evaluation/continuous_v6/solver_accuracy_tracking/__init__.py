"""Precisão do solver (v6 tracking)."""

from __future__ import annotations

from typing import Any


def solver_accuracy_tracking_v6_stub(correct: int, total: int) -> dict[str, Any]:
    return {"accuracy": correct / total if total else 0.0, "total": total}
