"""Executable datasets v2."""

from __future__ import annotations

import json
from pathlib import Path

API = Path(__file__).resolve().parents[2]


def test_replay_consistency_dataset_files() -> None:
    root = API / "evaluation/runtime_execution/executable_real_replay_consistency"
    assert (root / "manifest.json").is_file()
    assert (root / "expectations.json").is_file()
    manifest = json.loads((root / "manifest.json").read_text(encoding="utf-8"))
    assert manifest["dataset_version"] == "real-v2"
