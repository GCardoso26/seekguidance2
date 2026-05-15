"""runtime_execution_v1."""
from __future__ import annotations

from app.runtime.production_runtime.runtime_execution_worker_v1 import runtime_execution_worker_v1_stub


def test_runtime_execution_v1_payload() -> None:
    p = runtime_execution_worker_v1_stub("scope")
    assert p["runtime_confidence"] > 0
    assert "assistant_notes" in p
    assert "deterministic_alignment" in p
