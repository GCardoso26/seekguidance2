"""Runtime execution readiness."""

from __future__ import annotations

from app.runtime.production_runtime import runtime_execution_readiness_stub


def test_execution_readiness() -> None:
    p = runtime_execution_readiness_stub("exec-1")
    assert p["execution_readiness_score"] > 0
    assert p["runtime_confidence"] > 0
