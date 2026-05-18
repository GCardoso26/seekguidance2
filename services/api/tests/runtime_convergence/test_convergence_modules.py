"""runtime_convergence stubs."""
from __future__ import annotations

import importlib

import pytest

_PKG = "app.runtime.runtime_convergence"
_MODULES = [
    "runtime_convergence_engine_v1",
    "runtime_domain_registry_v1",
    "runtime_capability_index_v1",
    "runtime_contract_index_v1",
    "runtime_dependency_resolution_v1",
    "runtime_execution_routing_v1",
    "runtime_adapter_registry_v1",
    "runtime_operational_topology_v1",
    "runtime_convergence_health_v1",
    "runtime_convergence_summary_v1",
]


@pytest.mark.parametrize("name", _MODULES)
def test_convergence_stub(name: str) -> None:
    mod = importlib.import_module(f"{_PKG}.{name}")
    stub = getattr(mod, f"{name}_stub")
    r = stub(f"rc-{name}")
    assert r["integrity_status"] == "ok"
    assert float(r["runtime_confidence"]) > 0


def test_convergence_engine_writes_artifact() -> None:
    from app.runtime.runtime_convergence.runtime_convergence_summary_v1 import runtime_convergence_engine_v1

    runtime_convergence_engine_v1("rc-art")
    from pathlib import Path

    p = Path("generated/runtime_artifacts/runtime_convergence_v1/rc-art-registry.json")
    assert p.is_file()
