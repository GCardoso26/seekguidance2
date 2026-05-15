"""runtime_lifecycle_v7."""
from __future__ import annotations

from app.runtime.production_runtime.runtime_lifecycle_manager_v1 import runtime_lifecycle_manager_v1_stub


def test_runtime_lifecycle_v7_payload() -> None:
    p = runtime_lifecycle_manager_v1_stub("scope")
    assert p["runtime_confidence"] > 0
    assert "assistant_notes" in p
