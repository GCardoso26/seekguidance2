"""openapi_runtime_enforcement_v1."""
from __future__ import annotations

from pathlib import Path

from app.api.openapi_runtime_real.runtime_openapi_enforcement_v9 import runtime_openapi_enforcement_v9_stub


def test_openapi_runtime_enforcement_v1_payload() -> None:
    p = runtime_openapi_enforcement_v9_stub("run9")
    assert p["runtime_confidence"] > 0
    assert "openapi_enforcement_summary" in p

def test_drift_artifact_exists() -> None:
    root = Path(__file__).resolve().parents[2] / "generated" / "runtime_artifacts" / "drift"
    assert root.is_dir()
