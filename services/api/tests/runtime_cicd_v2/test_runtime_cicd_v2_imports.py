"""runtime_cicd_v2."""
from __future__ import annotations

from app.api.openapi_runtime_real.runtime_cicd_pipeline_v2 import runtime_cicd_pipeline_v2_stub


def test_runtime_cicd_v2_payload() -> None:
    p = runtime_cicd_pipeline_v2_stub("run8")
    assert p["runtime_confidence"] > 0
    assert "assistant_notes" in p
