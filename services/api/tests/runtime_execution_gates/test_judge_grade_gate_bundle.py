"""Judge-grade v4 gate bundle."""

from __future__ import annotations

from judge_grade_datasets_v4 import v4_dataset_gate_bundle_stub


def test_v4_dataset_gate_bundle() -> None:
    b = v4_dataset_gate_bundle_stub("run-y")
    assert "gates" in b
    assert "cross_version" in b["gates"]
