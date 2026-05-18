"""datasets v28."""
import json
from pathlib import Path

import pytest

API = Path(__file__).resolve().parents[2]
_NAMES = [
    "executable_real_civilization_coordination_v28",
    "executable_real_meta_stability_v28",
    "executable_real_multi_organizational_v28",
    "executable_real_civilization_governance_v28",
    "executable_real_public_continuity_v28",
]


@pytest.mark.parametrize("name", _NAMES)
def test_v28_manifest(name: str) -> None:
    m = API / "evaluation/runtime_execution" / name / "manifest.json"
    assert json.loads(m.read_text(encoding="utf-8"))["dataset_version"] == "real-v28"
