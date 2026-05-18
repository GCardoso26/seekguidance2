"""runtime_civilization_governance."""
from __future__ import annotations

import importlib

import pytest

_PKG = "app.runtime.runtime_governance_mesh"
_MODULES = [
    "runtime_civilization_governance_engine_v1",
    "runtime_governance_propagation_v1",
    "runtime_adaptive_policy_civilization_v1",
    "runtime_governance_survivability_intel_v1",
    "runtime_inter_ecosystem_policy_conv_v1",
    "runtime_distributed_gov_equilibrium_v1",
    "runtime_governance_continuity_forecast_v1",
    "runtime_semantic_gov_resilience_v1",
    "runtime_ecosystem_gov_harmonization_v1",
    "runtime_civilization_compliance_v1",
]


@pytest.mark.parametrize("name", _MODULES)
def test_cgv_stub(name: str) -> None:
    mod = importlib.import_module(f"{_PKG}.{name}")
    r = getattr(mod, f"{name}_stub")(f"cgv-{name}")
    assert r["integrity_status"] == "ok"
    assert float(r["runtime_confidence"]) > 0

def test_cgv_artifact() -> None:
    from pathlib import Path

    from app.runtime.runtime_governance_mesh.runtime_civilization_governance_engine_v1 import (
        runtime_civilization_governance_engine_v1,
    )
    runtime_civilization_governance_engine_v1("cgv-art")
    assert (Path("generated/runtime_artifacts/civilization_governance_v1/cgv-art-governance.json")).is_file()
