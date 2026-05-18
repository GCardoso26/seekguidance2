"""runtime_structural_governance."""
from __future__ import annotations

import importlib

import pytest

_PKG = "app.runtime.runtime_consolidation"
_MODULES = [
    "runtime_structural_governance_engine_v1",
    "runtime_complexity_governance_v1",
    "runtime_structural_stabilization_v1",
    "runtime_entropy_containment_v1",
    "runtime_fragmentation_prevention_gov_v1",
    "runtime_lifecycle_stabilization_v1",
    "runtime_architectural_continuity_v1",
    "runtime_semantic_gov_preservation_v1",
    "runtime_structural_convergence_v1",
    "runtime_sustainability_coordination_v1",
    "runtime_architecture_survivability_v1",
]


@pytest.mark.parametrize("name", _MODULES)
def test_stg_stub(name: str) -> None:
    mod = importlib.import_module(f"{_PKG}.{name}")
    r = getattr(mod, f"{name}_stub")(f"stg-{name}")
    assert r["integrity_status"] == "ok"
    assert float(r["runtime_confidence"]) > 0

def test_stg_artifact() -> None:
    from pathlib import Path

    from app.runtime.runtime_consolidation.runtime_structural_governance_engine_v1 import (
        runtime_structural_governance_engine_v1,
    )
    runtime_structural_governance_engine_v1("stg-art")
    p = Path("generated/runtime_artifacts/structural_governance_v1")
    assert (p / "stg-art-governance.json").is_file()
