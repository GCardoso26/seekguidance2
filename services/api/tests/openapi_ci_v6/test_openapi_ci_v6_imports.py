"""openapi_ci_v6."""
from __future__ import annotations

from app.api.openapi_runtime_real.runtime_openapi_ci_summary_v2 import runtime_openapi_ci_summary_v2_stub


def test_openapi_ci_v6_payload() -> None:
    p = runtime_openapi_ci_summary_v2_stub("run6")
    assert p["runtime_confidence"] > 0
    assert "assistant_notes" in p
