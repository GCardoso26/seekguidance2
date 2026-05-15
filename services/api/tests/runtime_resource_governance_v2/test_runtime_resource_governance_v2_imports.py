"""runtime_resource_governance_v2."""
from __future__ import annotations

from app.runtime.runtime_resource_governance.runtime_resource_enforcement_v2 import runtime_resource_enforcement_v2_stub


def test_runtime_resource_governance_v2_payload() -> None:
    p = runtime_resource_enforcement_v2_stub("scope")
    assert p["runtime_confidence"] > 0
    assert "assistant_notes" in p
