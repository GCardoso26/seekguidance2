"""pilot_runtime_v4."""
from __future__ import annotations

from app.runtime.pilot_runtime.pilot_runtime_execution_runtime_v4 import pilot_runtime_execution_runtime_v4_stub


def test_pilot_runtime_v4_payload() -> None:
    p = pilot_runtime_execution_runtime_v4_stub("scope")
    assert p["runtime_confidence"] > 0
    assert "assistant_notes" in p
    assert "deterministic_alignment" in p
