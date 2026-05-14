"""Runtime confidence."""

from __future__ import annotations

from app.runtime.production_runtime import runtime_confidence_runtime_ops_stub


def test_runtime_confidence() -> None:
    assert runtime_confidence_runtime_ops_stub(0.88)["runtime_confidence"] == 0.88
