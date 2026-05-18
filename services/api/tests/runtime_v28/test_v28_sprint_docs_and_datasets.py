"""Docs e datasets v27 sprint v28."""
from __future__ import annotations

import json
from pathlib import Path

import pytest

API = Path(__file__).resolve().parents[2]
REPO = Path(__file__).resolve().parents[4]
_DOCS = [
    "ADAPTIVE_RUNTIME_CIVILIZATION.md",
    "AUTONOMOUS_ECOSYSTEM_CONVERGENCE.md",
    "EVOLUTIONARY_OPERATIONAL_INTELLIGENCE.md",
    "SELF_ORGANIZING_RESILIENCE_NETWORK.md",
    "ENTERPRISE_RUNTIME_NERVOUS_SYSTEM_V3.md",
    "SUSTAINABLE_PERFORMANCE_INTELLIGENCE.md",
    "GOVERNANCE_EVOLUTION_FABRIC.md",
    "PUBLIC_ECOSYSTEM_EVOLUTION.md",
    "OPERATIONAL_EVOLUTION_AND_SURVIVABILITY.md",
    "RUNTIME_CIVILIZATION_CONVERGENCE.md",
]
_DATASETS = [
    "executable_real_adaptive_civilization_v27",
    "executable_real_ecosystem_convergence_v27",
    "executable_real_governance_evolution_v27",
    "executable_real_nervous_system_v27",
    "executable_real_public_evolution_v27",
]


@pytest.mark.parametrize("doc", _DOCS)
def test_v28_doc(doc: str) -> None:
    assert (REPO / "docs" / doc).is_file()


@pytest.mark.parametrize("name", _DATASETS)
@pytest.mark.parametrize("artifact", ["cognition.json", "fabric.json"])
def test_v27_dataset_files(name: str, artifact: str) -> None:
    p = API / "evaluation/runtime_execution" / name / artifact
    data = json.loads(p.read_text(encoding="utf-8"))
    assert isinstance(data, dict) and len(data) >= 1
