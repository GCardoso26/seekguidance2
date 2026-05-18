"""runtime_evolution_governance modules."""
from __future__ import annotations

import importlib

import pytest

_PKG = "app.runtime.runtime_lifecycle_governance"
_MODULES = [
    "runtime_evolution_governance_engine_v1",
    "runtime_contract_evolution_v1",
    "runtime_payload_evolution_v1",
    "runtime_schema_evolution_v1",
    "runtime_api_evolution_v1",
    "runtime_sdk_evolution_v1",
    "runtime_release_evolution_v1",
    "runtime_evolution_risk_v1",
    "runtime_evolution_approval_v1",
    "runtime_evolution_summary_v1",
]


@pytest.mark.parametrize("name", _MODULES)
def test_evol_stub(name: str) -> None:
    mod = importlib.import_module(f"{_PKG}.{name}")
    stub = getattr(mod, f"{name}_stub")
    r = stub(f"evol-{name}")
    assert r["integrity_status"] == "ok"
    assert float(r["runtime_confidence"]) > 0
