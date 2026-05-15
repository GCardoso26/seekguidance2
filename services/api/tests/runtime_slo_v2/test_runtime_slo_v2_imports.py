"""runtime_slo_v2."""
from __future__ import annotations

from app.runtime.runtime_slo.runtime_slo_violation_aggregation_v2 import runtime_slo_violation_aggregation_v2_stub


def test_runtime_slo_v2_payload() -> None:
    p = runtime_slo_violation_aggregation_v2_stub("scope")
    assert p["runtime_confidence"] > 0
    assert "assistant_notes" in p
