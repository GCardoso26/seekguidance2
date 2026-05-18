"""runtime_operational_consensus."""
from __future__ import annotations

import importlib

import pytest

_PKG = "app.runtime.runtime_operational_consensus"
_MODULES = [
    "runtime_operational_consensus_engine_v1",
    "runtime_consensus_scoring_v1",
    "runtime_consensus_forecasting_v1",
    "runtime_consensus_governance_v1",
    "runtime_consensus_registry_v1",
    "runtime_consensus_heuristics_v1",
    "runtime_consensus_balancing_v1",
    "runtime_consensus_sustainability_v1",
    "runtime_consensus_convergence_v1",
    "runtime_operational_consensus_summary_v1",
]


@pytest.mark.parametrize("name", _MODULES)
def test_cons_stub(name: str) -> None:
    mod = importlib.import_module(f"{_PKG}.{name}")
    r = getattr(mod, f"{name}_stub")(f"cons-{name}")
    assert r["integrity_status"] == "ok"
    assert float(r["runtime_confidence"]) > 0
