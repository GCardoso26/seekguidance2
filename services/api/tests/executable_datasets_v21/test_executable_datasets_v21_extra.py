"""datasets v21."""
import json
from pathlib import Path

import pytest

API = Path(__file__).resolve().parents[2]
_NAMES = [
    "executable_real_stewardship_v21",
    "executable_real_multiversion_v21",
    "executable_real_ecosystem_governance_v21",
    "executable_real_longitudinal_v21",
    "executable_real_adoption_v21",
]


@pytest.mark.parametrize("name", _NAMES)
def test_v21_manifest(name: str) -> None:
    m = API / "evaluation/runtime_execution" / name / "manifest.json"
    assert json.loads(m.read_text(encoding="utf-8"))["dataset_version"] == "real-v21"
