"""runtime_resource_governance_v7."""
from __future__ import annotations

from app.runtime.runtime_resource_governance.runtime_resource_engine_v1 import runtime_resource_engine_v1_stub


def test_runtime_resource_governance_v7_payload() -> None:
    p = runtime_resource_engine_v1_stub("scope")
    assert p["runtime_confidence"] > 0
    assert "assistant_notes" in p
