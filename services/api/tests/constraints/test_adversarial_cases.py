"""Datasets adversariais (schema)."""

import json
from pathlib import Path


def test_adversarial_dataset_schema() -> None:
    root = Path(__file__).resolve().parents[2] / "datasets" / "adversarial" / "timing_traps"
    p = root / "sba_before_replacement.json"
    data = json.loads(p.read_text(encoding="utf-8"))
    assert "valid_chain" in data
    assert "invalid_chains" in data
    assert data["game"] == "mtg"
