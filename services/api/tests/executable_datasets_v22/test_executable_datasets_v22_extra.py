"""datasets v22."""
import json
from pathlib import Path

import pytest

API = Path(__file__).resolve().parents[2]
_NAMES = [
    "executable_real_autonomy_v22",
    "executable_real_continuous_cert_v22",
    "executable_real_global_ecosystem_v22",
    "executable_real_sustainability_intel_v22",
    "executable_real_platform_economics_v22",
]


@pytest.mark.parametrize("name", _NAMES)
def test_v22_manifest(name: str) -> None:
    m = API / "evaluation/runtime_execution" / name / "manifest.json"
    assert json.loads(m.read_text(encoding="utf-8"))["dataset_version"] == "real-v22"
