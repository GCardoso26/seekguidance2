"""Real observability behaviors."""
from __future__ import annotations

from app.runtime.runtime_connected_observability.runtime_real_observability_summary_v1 import (
    runtime_real_observability_engine_v1,
)


def test_real_observability_degradable() -> None:
    r = runtime_real_observability_engine_v1("ga19-obs")
    assert r["observability_score"] > 0
    assert r["otlp_connector"]["degraded_ok"] is True


def test_public_api_semver() -> None:
    from app.runtime.public_runtime_api.public_runtime_api_summary_v1 import public_runtime_api_engine_v1
    r = public_runtime_api_engine_v1("ga19-api")
    assert r["semver"]["major"] == 1
