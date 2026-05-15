"""datasets v11."""
import json
from pathlib import Path

API = Path(__file__).resolve().parents[2]

def test_v11_manifest() -> None:
    m = API / "evaluation/runtime_execution/executable_real_operational_v11/manifest.json"
    assert json.loads(m.read_text(encoding="utf-8"))["dataset_version"] == "real-v11"
