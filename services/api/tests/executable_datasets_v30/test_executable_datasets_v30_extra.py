"""datasets v30."""
import json
from pathlib import Path

import pytest

API = Path(__file__).resolve().parents[2]
_NAMES = [
    "executable_real_institutional_governance_v30",
    "executable_real_operational_memory_v30",
    "executable_real_organizational_resilience_v30",
    "executable_real_executive_oversight_v30",
    "executable_real_public_institutional_v30",
]


@pytest.mark.parametrize("name", _NAMES)
def test_v30_manifest(name: str) -> None:
    m = API / "evaluation/runtime_execution" / name / "manifest.json"
    assert json.loads(m.read_text(encoding="utf-8"))["dataset_version"] == "real-v30"
