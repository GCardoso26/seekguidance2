"""mobile_stabilization_v7."""
from __future__ import annotations

from app.mobile_runtime.mobile_runtime_stability_v1 import mobile_runtime_stability_v1_stub


def test_mobile_stabilization_v7_payload() -> None:
    p = mobile_runtime_stability_v1_stub("device")
    assert p["runtime_confidence"] > 0
    assert "assistant_notes" in p
