"""operational_learning modules."""
from __future__ import annotations

import importlib

import pytest

_PKG = "app.runtime.runtime_knowledge_platform"
_MODULES = [
    "runtime_operational_learning_engine_v1",
    "runtime_incident_learning_v1",
    "runtime_recovery_learning_v1",
    "runtime_operational_pattern_learning_v1",
    "runtime_best_practice_evolution_v1",
    "runtime_runbook_evolution_v1",
    "runtime_operational_memory_v1",
    "runtime_operational_feedback_learning_v1",
    "runtime_knowledge_convergence_v1",
    "runtime_learning_summary_v1",
]


@pytest.mark.parametrize("name", _MODULES)
def test_learn_stub(name: str) -> None:
    mod = importlib.import_module(f"{_PKG}.{name}")
    stub = getattr(mod, f"{name}_stub")
    r = stub(f"learn-{name}")
    assert r["integrity_status"] == "ok"
    assert float(r["runtime_confidence"]) > 0
