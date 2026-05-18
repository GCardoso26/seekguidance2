"""public_ecosystem_maturity_v2."""
from __future__ import annotations

import importlib

import pytest

_PKG = "app.runtime.public_runtime_api"
_MODULES = [
    "runtime_public_ecosystem_maturity_engine_v2",
    "runtime_sdk_stability_scoring_v2",
    "runtime_semantic_version_continuity_v2",
    "runtime_compatibility_drift_v2",
    "runtime_migration_safety_forecast_v2",
    "runtime_ecosystem_fragmentation_v2",
    "runtime_adapter_compatibility_v2",
    "runtime_public_api_maturity_v2",
    "runtime_release_lifecycle_gov_v2",
    "runtime_multiversion_convergence_v2",
]


@pytest.mark.parametrize("name", _MODULES)
def test_pubmat_stub(name: str) -> None:
    mod = importlib.import_module(f"{_PKG}.{name}")
    stub = getattr(mod, f"{name}_stub")
    r = stub(f"pubmat-{name}")
    assert r["integrity_status"] == "ok"
    assert float(r["runtime_confidence"]) > 0
