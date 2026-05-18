"""Docs e datasets v26 sprint v27."""
from __future__ import annotations

import json
from pathlib import Path

import pytest

API = Path(__file__).resolve().parents[2]
REPO = Path(__file__).resolve().parents[4]
_DOCS = [
    "RUNTIME_COGNITIVE_GRID.md",
    "AUTONOMOUS_COORDINATION_NETWORK.md",
    "LONG_HORIZON_OPERATIONAL_INTELLIGENCE.md",
    "DISTRIBUTED_RESILIENCE_FABRIC.md",
    "ENTERPRISE_RUNTIME_NERVOUS_MESH_V2.md",
]
_DATASETS = [
    "executable_real_cognitive_grid_v26",
    "executable_real_coordination_network_v26",
    "executable_real_governance_convergence_v26",
    "executable_real_nervous_mesh_v26",
    "executable_real_public_longevity_v26",
]


@pytest.mark.parametrize("doc", _DOCS)
def test_v27_doc(doc: str) -> None:
    assert (REPO / "docs" / doc).is_file()


@pytest.mark.parametrize("name", _DATASETS)
@pytest.mark.parametrize("artifact", ["cognition.json", "fabric.json"])
def test_v26_dataset_files(name: str, artifact: str) -> None:
    p = API / "evaluation/runtime_execution" / name / artifact
    data = json.loads(p.read_text(encoding="utf-8"))
    assert isinstance(data, dict) and len(data) >= 1
