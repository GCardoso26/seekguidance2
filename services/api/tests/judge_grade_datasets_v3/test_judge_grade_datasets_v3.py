"""Judge-grade datasets v3."""

from __future__ import annotations

import json
from pathlib import Path

from judge_grade_datasets_v3 import v3_dataset_stub


def test_v3_stub() -> None:
    d = v3_dataset_stub("segoc")
    assert d["kind"] == "segoc"


def test_v3_manifest_file() -> None:
    root = Path(__file__).resolve().parents[2] / "evaluation" / "judge_grade_datasets_v3"
    data = json.loads((root / "manifests" / "stub_v3.json").read_text(encoding="utf-8"))
    assert data["dataset_id"]
