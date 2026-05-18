"""datasets v32."""
import json
from pathlib import Path

import pytest

API = Path(__file__).resolve().parents[2]
_NAMES = [
    "executable_real_institutional_continuity_v32",
    "executable_real_predictive_intelligence_v32",
    "executable_real_constitutional_evolution_v32",
    "executable_real_survivability_network_v32",
    "executable_real_public_institutional_continuity_v32",
]


@pytest.mark.parametrize("name", _NAMES)
def test_v32_manifest(name: str) -> None:
    m = API / "evaluation/runtime_execution" / name / "manifest.json"
    assert json.loads(m.read_text(encoding="utf-8"))["dataset_version"] == "real-v32"
