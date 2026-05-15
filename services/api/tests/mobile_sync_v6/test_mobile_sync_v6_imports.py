"""mobile_sync_v6."""
from __future__ import annotations

from app.mobile_runtime.mobile_runtime_sync_engine_v5 import mobile_runtime_sync_engine_v5_stub


def test_mobile_sync_v6_payload() -> None:
    p = mobile_runtime_sync_engine_v5_stub("device")
    assert p["runtime_confidence"] > 0
    assert "assistant_notes" in p
