"""Replay governance."""

from __future__ import annotations

from app.runtime.production_runtime import replay_governance_integration_stub
from app.runtime.replay_stability import (
    distributed_replay_consistency_stub,
    replay_archive_validation_stub,
    replay_branch_governance_stub,
    replay_compaction_history_stub,
    replay_hash_verification_stub,
    replay_integrity_stub,
    replay_lineage_stub,
    replay_temporal_alignment_stub,
)


def test_lineage() -> None:
    assert replay_lineage_stub("r", parents=["p"])["parents"] == ["p"]


def test_integrity() -> None:
    assert replay_integrity_stub("a", "a")["ok"] is True


def test_archive_validation() -> None:
    assert replay_archive_validation_stub("arch", True)["valid"] is True


def test_distributed_consistency() -> None:
    assert distributed_replay_consistency_stub(["h", "h"])["consistent"] is True


def test_temporal_alignment() -> None:
    assert replay_temporal_alignment_stub([1, 2, 3])["monotonic"] is True


def test_hash_verification() -> None:
    assert replay_hash_verification_stub("x", "x")["match"] is True


def test_compaction_history() -> None:
    assert replay_compaction_history_stub(5)["compactions"] == 5


def test_branch_governance() -> None:
    assert replay_branch_governance_stub(100, cap=10)["capped"] is True


def test_production_integration() -> None:
    assert replay_governance_integration_stub("r", "h", "h")["production_ready"] is True
