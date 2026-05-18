"""gates v32 institutional continuity."""
import importlib
import json
from pathlib import Path

import pytest

API = Path(__file__).resolve().parents[2]
_GATES = [
    "institutional_continuity_gate_v32",
    "predictive_intelligence_gate_v32",
    "constitutional_evolution_gate_v32",
    "survivability_network_gate_v32",
    "public_institutional_continuity_gate_v32",
]
_DATASETS = [
    "executable_real_institutional_continuity_v32",
    "executable_real_predictive_intelligence_v32",
    "executable_real_constitutional_evolution_v32",
    "executable_real_survivability_network_v32",
    "executable_real_public_institutional_continuity_v32",
]


@pytest.mark.parametrize("gate", _GATES)
def test_gate_v32_confidence(gate: str) -> None:
    mod = importlib.import_module(f"evaluation.runtime_execution.{gate}")
    p = getattr(mod, f"{gate}_stub")("g32b")
    assert p["gate_passed"]
    assert p["runtime_confidence"] >= 0.9


@pytest.mark.parametrize("name", _DATASETS)
def test_dataset_ingestion_mirror(name: str) -> None:
    ing = API.parents[1] / "ingestion" / "tcg_judge_ingestion" / name / "manifest.json"
    if not ing.is_file():
        pytest.skip("ingestion mirror missing")
    manifest = json.loads(ing.read_text(encoding="utf-8"))
    assert manifest["dataset_version"] == "real-v32"
