"""runtime_knowledge_platform modules."""
from __future__ import annotations

import importlib

import pytest

_PKG = "app.runtime.runtime_knowledge_platform"
_MODULES = [
    "runtime_knowledge_engine_v1",
    "runtime_runbook_registry_v1",
    "runtime_operational_playbook_v1",
    "runtime_incident_knowledge_v1",
    "runtime_recovery_knowledge_v1",
    "runtime_operational_patterns_v1",
    "runtime_best_practices_v1",
    "runtime_operational_guidance_v1",
    "runtime_runtime_learning_v1",
    "runtime_knowledge_summary_v1",
]


@pytest.mark.parametrize("name", _MODULES)
def test_know_stub(name: str) -> None:
    mod = importlib.import_module(f"{_PKG}.{name}")
    stub = getattr(mod, f"{name}_stub")
    r = stub(f"know-{name}")
    assert r["integrity_status"] == "ok"
    assert float(r["runtime_confidence"]) > 0
