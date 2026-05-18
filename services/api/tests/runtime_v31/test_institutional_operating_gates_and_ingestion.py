"""gates v30 e ingestion institutional."""
import importlib
import json
from pathlib import Path

import pytest

API = Path(__file__).resolve().parents[2]
_GATES = [
    "institutional_governance_gate_v30",
    "operational_memory_gate_v30",
    "resilience_survivability_gate_v30",
    "executive_oversight_gate_v30",
    "structural_governance_gate_v30",
]
_DATASETS = [
    "executable_real_institutional_governance_v30",
    "executable_real_operational_memory_v30",
    "executable_real_organizational_resilience_v30",
    "executable_real_executive_oversight_v30",
    "executable_real_public_institutional_v30",
]


@pytest.mark.parametrize("gate", _GATES)
def test_gate_v30_confidence(gate: str) -> None:
    mod = importlib.import_module(f"evaluation.runtime_execution.{gate}")
    p = getattr(mod, f"{gate}_stub")("g30b")
    assert p["gate_passed"]
    assert p["runtime_confidence"] >= 0.9


@pytest.mark.parametrize("name", _DATASETS)
def test_dataset_ingestion_mirror(name: str) -> None:
    ing = API.parents[1] / "ingestion" / "tcg_judge_ingestion" / name / "manifest.json"
    if not ing.is_file():
        pytest.skip("ingestion mirror missing")
    manifest = json.loads(ing.read_text(encoding="utf-8"))
    assert manifest["dataset_version"] == "real-v30"


_SUMMARY = [
    ("app.runtime.runtime_long_horizon_governance", "runtime_long_horizon_governance_summary_v1"),
    ("app.runtime.runtime_governance_continuity", "runtime_governance_continuity_summary_v1"),
    ("app.runtime.runtime_knowledge_continuity", "runtime_knowledge_continuity_summary_v1"),
    ("app.runtime.runtime_historical_reasoning", "runtime_historical_reasoning_summary_v1"),
    ("app.runtime.runtime_operational_survivability", "runtime_operational_survivability_summary_v1"),
    ("app.runtime.runtime_failure_absorption", "runtime_failure_absorption_summary_v1"),
    ("app.runtime.runtime_human_governance", "runtime_human_governance_summary_v1"),
    ("app.runtime.runtime_operational_council", "runtime_operational_council_summary_v1"),
]


@pytest.mark.parametrize("pkg,name", _SUMMARY)
def test_summary_stubs(pkg: str, name: str) -> None:
    mod = importlib.import_module(f"{pkg}.{name}")
    r = getattr(mod, f"{name}_stub")(f"sum-{name}")
    assert r["integrity_status"] == "ok"
