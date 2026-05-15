"""execution_governance_v7."""
from __future__ import annotations

from app.runtime.execution_governance.execution_governance_engine_v1 import execution_governance_engine_v1_stub


def test_execution_governance_v7_payload() -> None:
    p = execution_governance_engine_v1_stub("scope")
    assert p["runtime_confidence"] > 0
    assert "assistant_notes" in p
