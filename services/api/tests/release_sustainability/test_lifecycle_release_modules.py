"""release sustainability modules (lifecycle governance)."""
from __future__ import annotations

import importlib

import pytest

_PKG = "app.runtime.runtime_lifecycle_governance"
_MODULES = [
    "runtime_release_stability_engine_v1",
    "runtime_release_validation_engine_v1",
    "runtime_release_regression_engine_v1",
    "runtime_release_dependency_engine_v1",
    "runtime_release_compatibility_engine_v1",
    "runtime_release_migration_engine_v1",
    "runtime_release_support_engine_v1",
    "runtime_release_rollout_engine_v1",
    "runtime_release_recovery_engine_v1",
    "runtime_release_sustainability_summary_v1",
]


@pytest.mark.parametrize("name", _MODULES)
def test_lifecycle_release_stub(name: str) -> None:
    mod = importlib.import_module(f"{_PKG}.{name}")
    stub = getattr(mod, f"{name}_stub")
    r = stub(f"rel-{name}")
    assert r["integrity_status"] == "ok"
    assert float(r["runtime_confidence"]) > 0
