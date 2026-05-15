"""runtime_execution_quotas_v7."""
from __future__ import annotations

from app.runtime.runtime_execution_quotas.runtime_quota_engine_v1 import runtime_quota_engine_v1_stub


def test_runtime_execution_quotas_v7_payload() -> None:
    p = runtime_quota_engine_v1_stub("scope")
    assert p["runtime_confidence"] > 0
    assert "assistant_notes" in p
