"""Canonical interface stubs."""
from __future__ import annotations

from app.runtime.runtime_canonical.canonical_execution_interface_v1 import (
    canonical_execution_interface_v1_stub,
)
from app.runtime.runtime_canonical.canonical_federation_interface_v1 import (
    canonical_federation_interface_v1_stub,
)
from app.runtime.runtime_canonical.canonical_governance_interface_v1 import (
    canonical_governance_interface_v1_stub,
)
from app.runtime.runtime_canonical.canonical_observability_interface_v1 import (
    canonical_observability_interface_v1_stub,
)
from app.runtime.runtime_canonical.canonical_persistence_interface_v3 import (
    canonical_persistence_interface_v3_stub,
)
from app.runtime.runtime_canonical.canonical_replay_interface_v1 import (
    canonical_replay_interface_v1_stub,
)
from app.runtime.runtime_canonical.canonical_runtime_adapter_registry_v1 import (
    canonical_runtime_adapter_registry_v1_stub,
)
from app.runtime.runtime_canonical.canonical_runtime_contracts_v1 import (
    canonical_runtime_contracts_v1_stub,
)


def test_execution_interface() -> None:
    assert canonical_execution_interface_v1_stub("ga-if")["canonical_score"] > 0


def test_replay_interface() -> None:
    assert canonical_replay_interface_v1_stub("ga-if")["canonical_score"] > 0


def test_federation_interface() -> None:
    assert canonical_federation_interface_v1_stub("ga-if")["canonical_score"] > 0


def test_observability_interface() -> None:
    assert canonical_observability_interface_v1_stub("ga-if")["canonical_score"] > 0


def test_governance_interface() -> None:
    assert canonical_governance_interface_v1_stub("ga-if")["canonical_score"] > 0


def test_persistence_interface() -> None:
    assert canonical_persistence_interface_v3_stub("ga-if")["canonical_score"] > 0


def test_contracts_and_adapters() -> None:
    assert canonical_runtime_contracts_v1_stub("ga-if")["canonical_score"] > 0
    assert canonical_runtime_adapter_registry_v1_stub("ga-if")["canonical_score"] > 0
