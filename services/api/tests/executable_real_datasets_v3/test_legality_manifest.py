"""Datasets v3."""

from __future__ import annotations

import json
from pathlib import Path

API = Path(__file__).resolve().parents[2]


def test_legality_v3_manifest() -> None:
    p = API / "evaluation/runtime_execution/executable_real_legality_v3/manifest.json"
    data = json.loads(p.read_text(encoding="utf-8"))
    assert data["dataset_version"] == "real-v3"
