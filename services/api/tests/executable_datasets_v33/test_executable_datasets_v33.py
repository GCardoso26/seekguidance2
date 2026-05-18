"""executable datasets v33."""
from __future__ import annotations

import json
from pathlib import Path

import pytest

_NAMES = [
    "executable_real_world_degradation_v33",
    "executable_real_stewardship_orchestration_v33",
    "executable_real_entropy_convergence_v33",
    "executable_real_resilience_survivability_v33",
    "executable_real_structural_alignment_v33",
    "executable_real_predictive_governance_v33",
    "executable_real_continuity_forecasting_v33",
    "executable_real_operational_guardianship_v33",
    "executable_real_ecosystem_trust_v33",
    "executable_real_executive_operations_v33",
]


@pytest.mark.parametrize("name", _NAMES)
def test_dataset_v33_manifest(name: str) -> None:
    p = Path("evaluation/runtime_execution") / name / "manifest.json"
    assert p.is_file()
    data = json.loads(p.read_text(encoding="utf-8"))
    assert data.get("dataset_version") == "real-v33"
