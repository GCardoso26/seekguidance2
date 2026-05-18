"""knowledge v2 modules."""
from __future__ import annotations

import importlib

import pytest

_PKG = "app.runtime.runtime_knowledge_platform"
_MODULES = [
    "runtime_operational_knowledge_engine_v2",
    "runtime_playbook_aggregation_v1",
    "runtime_incident_pattern_correlation_v1",
    "runtime_runbook_convergence_v1",
    "runtime_operational_recommendations_v1",
    "runtime_anomaly_knowledge_base_v1",
]


@pytest.mark.parametrize("name", _MODULES)
def test_know2_stub(name: str) -> None:
    mod = importlib.import_module(f"{_PKG}.{name}")
    r = getattr(mod, f"{name}_stub")(f"know2-{name}")
    assert r["integrity_status"] == "ok"
