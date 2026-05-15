"""mobile_runtime_stability_v5."""
from __future__ import annotations

from app.mobile_runtime.mobile_runtime_stability_v5 import mobile_runtime_stability_v5_stub


def test_mobile_runtime_stability_v5_payload() -> None:
    p = mobile_runtime_stability_v5_stub("device")
    assert p["runtime_confidence"] > 0
    assert "assistant_notes" in p
