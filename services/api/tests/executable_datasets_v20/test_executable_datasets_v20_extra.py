"""datasets v20 manifests."""
from __future__ import annotations

import json
from pathlib import Path

import pytest

API = Path(__file__).resolve().parents[2]
_ROOT = API / "evaluation/runtime_execution"

_NAMES = [
    "executable_real_convergence_v20",
    "executable_real_sustainability_v20",
    "executable_real_release_v20",
    "executable_real_longrun_v20",
    "executable_real_ecosystem_ops_v20",
]


@pytest.mark.parametrize("name", _NAMES)
def test_v20_manifest(name: str) -> None:
    m = _ROOT / name / "manifest.json"
    data = json.loads(m.read_text(encoding="utf-8"))
    assert data["dataset_version"] == "real-v20"
