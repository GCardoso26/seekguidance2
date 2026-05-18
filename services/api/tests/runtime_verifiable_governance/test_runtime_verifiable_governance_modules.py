"""runtime_verifiable_governance."""
from __future__ import annotations

import importlib

import pytest

_PKG = "app.runtime.runtime_verifiable_governance"
_MODULES = [
    "runtime_verifiable_governance_engine_v1",
    "runtime_causal_verification_v1",
    "runtime_decision_trace_v1",
    "runtime_replayable_causality_v1",
    "runtime_deterministic_reasoning_v1",
    "runtime_governance_evidence_v1",
    "runtime_explainability_lineage_v1",
    "runtime_accountability_mapping_v1",
    "runtime_governance_replayability_v1",
    "runtime_audit_lineage_v1",
    "runtime_long_horizon_traceability_v1",
]


@pytest.mark.parametrize("name", _MODULES)
def test_vrg_stub(name: str) -> None:
    mod = importlib.import_module(f"{_PKG}.{name}")
    r = getattr(mod, f"{name}_stub")(f"vrg-{name}")
    assert r["integrity_status"] == "ok"
    assert float(r["runtime_confidence"]) > 0

def test_vrg_artifact() -> None:
    from pathlib import Path

    from app.runtime.runtime_verifiable_governance.runtime_verifiable_governance_engine_v1 import (
        runtime_verifiable_governance_engine_v1,
    )
    runtime_verifiable_governance_engine_v1("vrg-art")
    p = Path("generated/runtime_artifacts/verifiable_governance_v1")
    assert (p / "vrg-art-governance.json").is_file()
