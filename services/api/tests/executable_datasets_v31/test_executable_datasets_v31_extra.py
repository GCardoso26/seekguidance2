"""datasets v31."""
import json
from pathlib import Path

import pytest

API = Path(__file__).resolve().parents[2]
_NAMES = [
    "executable_real_temporal_governance_v31",
    "executable_real_evolutionary_stability_v31",
    "executable_real_operational_time_v31",
    "executable_real_change_governance_v31",
    "executable_real_public_evolutionary_v31",
]


@pytest.mark.parametrize("name", _NAMES)
def test_v31_manifest(name: str) -> None:
    m = API / "evaluation/runtime_execution" / name / "manifest.json"
    assert json.loads(m.read_text(encoding="utf-8"))["dataset_version"] == "real-v31"
