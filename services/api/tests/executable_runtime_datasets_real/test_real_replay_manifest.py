"""Executable real replay datasets."""

from __future__ import annotations

import json
from pathlib import Path

API = Path(__file__).resolve().parents[2]


def test_real_replay_manifest() -> None:
    p = API / "evaluation/runtime_execution/executable_real_replay_cases/manifest.json"
    data = json.loads(p.read_text(encoding="utf-8"))
    assert "replay_refs" in data
    assert data["deterministic_alignment"]["token"] == "dataset-real"
