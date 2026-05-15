"""deployment_runtime_v5 stub sweep."""
from __future__ import annotations

from app.runtime.runtime_distribution.runtime_deployment_bundle_engine_v1 import (
    runtime_deployment_bundle_engine_v1_stub,
)
from app.runtime.runtime_distribution.runtime_semantic_versioning_engine_v1 import (
    runtime_semantic_versioning_engine_v1_stub,
)


def test_deployment_runtime_v5_sweep() -> None:
    p_runtime = runtime_deployment_bundle_engine_v1_stub("ga30-sweep")
    assert p_runtime["runtime_confidence"] > 0
    p_runtime = runtime_semantic_versioning_engine_v1_stub("ga30-sweep")
    assert p_runtime["runtime_confidence"] > 0
