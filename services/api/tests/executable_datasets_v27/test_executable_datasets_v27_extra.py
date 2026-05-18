"""datasets v27."""
import json
from pathlib import Path

import pytest

API = Path(__file__).resolve().parents[2]
_NAMES = [
    "executable_real_adaptive_civilization_v27",
    "executable_real_ecosystem_convergence_v27",
    "executable_real_governance_evolution_v27",
    "executable_real_nervous_system_v27",
    "executable_real_public_evolution_v27",
]


@pytest.mark.parametrize("name", _NAMES)
def test_v27_manifest(name: str) -> None:
    m = API / "evaluation/runtime_execution" / name / "manifest.json"
    assert json.loads(m.read_text(encoding="utf-8"))["dataset_version"] == "real-v27"
