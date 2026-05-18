"""datasets v26."""
import json
from pathlib import Path

import pytest

API = Path(__file__).resolve().parents[2]
_NAMES = [
    "executable_real_cognitive_grid_v26",
    "executable_real_coordination_network_v26",
    "executable_real_governance_convergence_v26",
    "executable_real_nervous_mesh_v26",
    "executable_real_public_longevity_v26",
]


@pytest.mark.parametrize("name", _NAMES)
def test_v26_manifest(name: str) -> None:
    m = API / "evaluation/runtime_execution" / name / "manifest.json"
    assert json.loads(m.read_text(encoding="utf-8"))["dataset_version"] == "real-v26"
