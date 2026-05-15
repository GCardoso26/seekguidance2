"""executable datasets v6."""
from __future__ import annotations

import json
from pathlib import Path

API = Path(__file__).resolve().parents[2]

def test_executable_real_governance_v6() -> None:
    m = API / "evaluation/runtime_execution/executable_real_governance_v6/manifest.json"
    assert json.loads(m.read_text(encoding="utf-8"))["dataset_version"] == "real-v6"
