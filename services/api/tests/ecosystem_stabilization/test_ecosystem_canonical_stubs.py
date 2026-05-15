"""Ecosystem canonical stubs."""
from __future__ import annotations

from app.runtime.runtime_canonical.canonical_runtime_capability_registry_v2 import (
    canonical_runtime_capability_registry_v2_stub,
)
from app.runtime.runtime_canonical.canonical_runtime_semver_registry_v1 import (
    canonical_runtime_semver_registry_v1_stub,
)


def test_capability_registry() -> None:
    assert canonical_runtime_capability_registry_v2_stub("s")["ecosystem_score"] > 0


def test_semver_registry() -> None:
    assert canonical_runtime_semver_registry_v1_stub("s")["ecosystem_score"] > 0
