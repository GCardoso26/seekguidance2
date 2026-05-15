"""openapi_runtime_v5 imports."""

from __future__ import annotations

from app.api.openapi_runtime_real import openapi_runtime_ci_enforcement_v2_stub


def test_openapi_runtime_v5_payload() -> None:
    p = openapi_runtime_ci_enforcement_v2_stub("run1")
    assert p["runtime_confidence"] > 0
    assert "assistant_notes" in p
