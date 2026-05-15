"""Executable datasets v5."""
from __future__ import annotations

import json
from pathlib import Path

API = Path(__file__).resolve().parents[2]

def test_executable_real_replay_v5_manifest() -> None:
    p = API / "evaluation" / "runtime_execution" / "executable_real_replay_v5" / "manifest.json"
    data = json.loads(p.read_text(encoding="utf-8"))
    assert data.get("dataset_version") == "real-v5"
