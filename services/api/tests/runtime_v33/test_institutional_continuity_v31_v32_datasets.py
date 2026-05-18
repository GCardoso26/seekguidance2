"""datasets v30-v32."""
import json
from pathlib import Path

import pytest

API = Path(__file__).resolve().parents[2]
_NAMES = [
    "executable_real_temporal_governance_v31",
    "executable_real_evolutionary_stability_v31",
    "executable_real_institutional_governance_v30",
    "executable_real_operational_memory_v30",
    "executable_real_institutional_continuity_v32",
    "executable_real_predictive_intelligence_v32",
    "executable_real_constitutional_evolution_v32",
    "executable_real_survivability_network_v32",
    "executable_real_public_institutional_continuity_v32",
]


@pytest.mark.parametrize("name", _NAMES)
def test_dataset_v30_v32(name: str) -> None:
    m = API / "evaluation/runtime_execution" / name / "manifest.json"
    assert m.is_file()
    manifest = json.loads(m.read_text(encoding="utf-8"))
    assert manifest["dataset_version"].startswith("real-v")
