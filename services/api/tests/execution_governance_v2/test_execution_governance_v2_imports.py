"""execution_governance_v2."""
from __future__ import annotations

from app.runtime.execution_governance_v2.execution_governance_engine_v2 import execution_governance_engine_v2_stub


def test_execution_governance_v2_payload() -> None:
    p = execution_governance_engine_v2_stub("scope")
    assert p["runtime_confidence"] > 0
    assert "assistant_notes" in p
