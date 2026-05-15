"""mobile_runtime_realistic_v1."""
from __future__ import annotations

from app.mobile_runtime.mobile_runtime_sync_engine_v1 import mobile_runtime_sync_engine_v1_stub


def test_mobile_runtime_realistic_v1_payload() -> None:
    p = mobile_runtime_sync_engine_v1_stub("device")
    assert p["runtime_confidence"] > 0
    assert "assistant_notes" in p
    assert "deterministic_alignment" in p
