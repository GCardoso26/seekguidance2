"""datasets v7."""
import json
from pathlib import Path

API = Path(__file__).resolve().parents[2]

def test_manifest_v7() -> None:
    p = API / "evaluation/runtime_execution/executable_real_replay_v7/manifest.json"
    assert json.loads(p.read_text(encoding="utf-8"))["dataset_version"] == "real-v7"
