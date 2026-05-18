"""datasets v30-v31."""
import json
from pathlib import Path

import pytest

API = Path(__file__).resolve().parents[2]
_NAMES = [
    "executable_real_institutional_governance_v30",
    "executable_real_operational_memory_v30",
    "executable_real_temporal_governance_v31",
    "executable_real_evolutionary_stability_v31",
    "executable_real_operational_time_v31",
    "executable_real_change_governance_v31",
    "executable_real_public_evolutionary_v31",
]


@pytest.mark.parametrize("name", _NAMES)
def test_dataset_v30_v31(name: str) -> None:
    m = API / "evaluation/runtime_execution" / name / "manifest.json"
    assert m.is_file()
    manifest = json.loads(m.read_text(encoding="utf-8"))
    assert manifest["dataset_version"].startswith("real-v")
