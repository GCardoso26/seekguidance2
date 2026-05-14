"""Judge-grade v4 — extensões mobile/offline."""

from __future__ import annotations

from judge_grade_datasets_v4 import mobile_dataset_profile_stub, v4_dataset_stub


def test_v4_stub_unchanged() -> None:
    assert v4_dataset_stub("x")["version"] == "v4-stub"


def test_mobile_dataset_profile() -> None:
    out = mobile_dataset_profile_stub("compact-a")
    assert out["lineage_replay_awareness"]["slice"] == "mdp-compact-a"
