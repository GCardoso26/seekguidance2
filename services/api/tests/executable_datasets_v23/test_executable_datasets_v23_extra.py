"""datasets v23."""
import json
from pathlib import Path

import pytest

API = Path(__file__).resolve().parents[2]
_NAMES = [
    "executable_real_os_convergence_v23",
    "executable_real_longitudinal_stewardship_v23",
    "executable_real_ecosystem_governance_v23",
    "executable_real_infra_stabilization_v23",
    "executable_real_operational_cert_v23",
]


@pytest.mark.parametrize("name", _NAMES)
def test_v23_manifest(name: str) -> None:
    m = API / "evaluation/runtime_execution" / name / "manifest.json"
    assert json.loads(m.read_text(encoding="utf-8"))["dataset_version"] == "real-v23"
