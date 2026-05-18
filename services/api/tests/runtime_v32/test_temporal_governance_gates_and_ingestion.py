"""gates v31 temporal."""
import importlib
import json
from pathlib import Path

import pytest

API = Path(__file__).resolve().parents[2]
_GATES = [
    "temporal_governance_gate_v31",
    "evolutionary_stability_gate_v31",
    "operational_time_gate_v31",
    "change_governance_gate_v31",
    "architectural_longevity_gate_v31",
]
_DATASETS = [
    "executable_real_temporal_governance_v31",
    "executable_real_evolutionary_stability_v31",
    "executable_real_operational_time_v31",
    "executable_real_change_governance_v31",
    "executable_real_public_evolutionary_v31",
]


@pytest.mark.parametrize("gate", _GATES)
def test_gate_v31_confidence(gate: str) -> None:
    mod = importlib.import_module(f"evaluation.runtime_execution.{gate}")
    p = getattr(mod, f"{gate}_stub")("g31b")
    assert p["gate_passed"]
    assert p["runtime_confidence"] >= 0.9


@pytest.mark.parametrize("name", _DATASETS)
def test_dataset_ingestion_mirror(name: str) -> None:
    ing = API.parents[1] / "ingestion" / "tcg_judge_ingestion" / name / "manifest.json"
    if not ing.is_file():
        pytest.skip("ingestion mirror missing")
    manifest = json.loads(ing.read_text(encoding="utf-8"))
    assert manifest["dataset_version"] == "real-v31"
