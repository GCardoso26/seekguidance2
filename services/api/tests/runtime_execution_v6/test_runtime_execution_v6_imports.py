"""runtime_execution_v6."""
from __future__ import annotations

from app.runtime.production_runtime.runtime_execution_orchestrator_v3 import runtime_execution_orchestrator_v3_stub


def test_runtime_execution_v6_payload() -> None:
    p = runtime_execution_orchestrator_v3_stub("scope")
    assert p["runtime_confidence"] > 0
    assert "assistant_notes" in p
