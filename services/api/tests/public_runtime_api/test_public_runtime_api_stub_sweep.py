"""public_runtime_api stub sweep."""
from __future__ import annotations

from app.runtime.public_runtime_api.public_runtime_compatibility_v1 import public_runtime_compatibility_v1_stub
from app.runtime.public_runtime_api.public_runtime_semver_v1 import public_runtime_semver_v1_stub


def test_public_runtime_api_sweep() -> None:
    p_public = public_runtime_semver_v1_stub("ga30-sweep")
    assert p_public["runtime_confidence"] > 0
    p_public = public_runtime_compatibility_v1_stub("ga30-sweep")
    assert p_public["runtime_confidence"] > 0
