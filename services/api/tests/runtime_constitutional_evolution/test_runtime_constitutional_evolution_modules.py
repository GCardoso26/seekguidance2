"""runtime_constitutional_evolution."""
from __future__ import annotations

import importlib

import pytest

_PKG = "app.runtime.runtime_constitutional_evolution"
_MODULES = [
    "runtime_constitutional_evolution_engine_v1",
    "runtime_governed_policy_evolution_v1",
    "runtime_safe_constitutional_revision_v1",
    "runtime_institutional_versioning_v1",
    "runtime_constitutional_rollback_v1",
    "runtime_governance_drift_detection_v1",
    "runtime_temporal_policy_compat_v1",
    "runtime_evolution_audit_v1",
    "runtime_revision_governance_v1",
    "runtime_constitutional_stability_v1",
    "runtime_policy_lineage_evolution_v1",
]


@pytest.mark.parametrize("name", _MODULES)
def test_cev_stub(name: str) -> None:
    mod = importlib.import_module(f"{_PKG}.{name}")
    r = getattr(mod, f"{name}_stub")(f"cev-{name}")
    assert r["integrity_status"] == "ok"
    assert float(r["runtime_confidence"]) > 0

def test_cev_artifact() -> None:
    import importlib
    from pathlib import Path

    fn = importlib.import_module(
        "app.runtime.runtime_constitutional_evolution.runtime_constitutional_evolution_engine_v1"
    ).runtime_constitutional_evolution_engine_v1
    fn("cev-art")
    p = Path("generated/runtime_artifacts/constitutional_evolution_v1")
    assert (p / "cev-art-evolution.json").is_file()
