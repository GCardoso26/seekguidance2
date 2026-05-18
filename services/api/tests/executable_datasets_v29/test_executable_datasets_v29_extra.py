"""datasets v29."""
import json
from pathlib import Path

import pytest

API = Path(__file__).resolve().parents[2]
_NAMES = [
    "executable_real_verifiable_governance_v29",
    "executable_real_human_coordination_v29",
    "executable_real_operational_reasoning_v29",
    "executable_real_formal_certification_v29",
    "executable_real_runtime_constitution_v29",
]


@pytest.mark.parametrize("name", _NAMES)
def test_v29_manifest(name: str) -> None:
    m = API / "evaluation/runtime_execution" / name / "manifest.json"
    assert json.loads(m.read_text(encoding="utf-8"))["dataset_version"] == "real-v29"
