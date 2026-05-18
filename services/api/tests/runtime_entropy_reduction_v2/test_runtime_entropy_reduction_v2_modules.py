"""runtime_entropy_reduction_v2."""
from __future__ import annotations

import importlib

import pytest

_PKG = "app.runtime.runtime_entropy_reduction_v2"
_MODULES = [
    "runtime_entropy_reduction_engine_v2",
    "runtime_canonical_alignment_v1",
    "runtime_duplication_detection_v1",
    "runtime_adapter_overlap_v1",
    "runtime_redundant_path_detection_v1",
    "runtime_orchestration_convergence_v1",
    "runtime_governance_convergence_v1",
    "runtime_operational_simplification_scoring_v1",
    "runtime_entropy_reduction_v2_summary_v1",
]


@pytest.mark.parametrize("name", _MODULES)
def test_enr2_stub(name: str) -> None:
    mod = importlib.import_module(f"{_PKG}.{name}")
    r = getattr(mod, f"{name}_stub")(f"enr2-{name}")
    assert r["integrity_status"] == "ok"
    assert float(r["runtime_confidence"]) > 0
