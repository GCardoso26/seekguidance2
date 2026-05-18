"""datasets v24."""
import json
from pathlib import Path

import pytest

API = Path(__file__).resolve().parents[2]
_NAMES = [
    "executable_real_autonomous_governance_v24",
    "executable_real_federated_intelligence_v24",
    "executable_real_self_healing_v24",
    "executable_real_control_plane_v24",
    "executable_real_ecosystem_maturity_v24",
]


@pytest.mark.parametrize("name", _NAMES)
def test_v24_manifest(name: str) -> None:
    m = API / "evaluation/runtime_execution" / name / "manifest.json"
    assert json.loads(m.read_text(encoding="utf-8"))["dataset_version"] == "real-v24"
