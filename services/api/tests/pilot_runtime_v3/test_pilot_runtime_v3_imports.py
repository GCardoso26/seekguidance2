"""pilot_runtime_v3."""
from __future__ import annotations

from app.runtime.pilot_runtime.pilot_runtime_execution_v3 import pilot_runtime_execution_v3_stub


def test_pilot_runtime_v3_payload() -> None:
    p = pilot_runtime_execution_v3_stub("scope")
    assert p["runtime_confidence"] > 0
    assert "assistant_notes" in p
