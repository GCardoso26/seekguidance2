"""datasets v25."""
import json
from pathlib import Path

import pytest

API = Path(__file__).resolve().parents[2]
_NAMES = [
    "executable_real_intelligence_mesh_v25",
    "executable_real_operations_fabric_v25",
    "executable_real_governance_mesh_v25",
    "executable_real_nervous_system_v25",
    "executable_real_ecosystem_stability_v25",
]


@pytest.mark.parametrize("name", _NAMES)
def test_v25_manifest(name: str) -> None:
    m = API / "evaluation/runtime_execution" / name / "manifest.json"
    assert json.loads(m.read_text(encoding="utf-8"))["dataset_version"] == "real-v25"
