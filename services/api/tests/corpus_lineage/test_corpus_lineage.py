"""Corpus + lineage (ingestão real-world platform)."""

from __future__ import annotations

from tcg_judge_ingestion.cross_version_policy_deltas import policy_delta_lineage_stub
from tcg_judge_ingestion.historical_judge_decisions import judge_decision_record_stub
from tcg_judge_ingestion.legacy_ruling_reconstruction import legacy_ruling_reconstruct_stub
from tcg_judge_ingestion.multiplayer_dispute_archives import multiplayer_dispute_stub
from tcg_judge_ingestion.publisher_policy_tracking import publisher_policy_version_stub
from tcg_judge_ingestion.real_world_corpus import conflict_aware_lineage_stub
from tcg_judge_ingestion.semantic_replay_archives import semantic_replay_archive_stub
from tcg_judge_ingestion.temporal_errata_graph import temporal_errata_edge_stub
from tcg_judge_ingestion.tournament_investigation_archives import tournament_investigation_stub


def test_policy_delta() -> None:
    assert policy_delta_lineage_stub("v1", "v2")["to"] == "v2"


def test_judge_decision() -> None:
    assert judge_decision_record_stub("c1")["tier"] == "judge_assistant"


def test_legacy_reconstruction() -> None:
    assert "reconstructed" in legacy_ruling_reconstruct_stub("abc")["status"]


def test_multiplayer_dispute_archive() -> None:
    assert multiplayer_dispute_stub(6)["players"] == 6


def test_publisher_policy() -> None:
    assert publisher_policy_version_stub("p", "1")["version"] == "1"


def test_real_world_conflict_lineage() -> None:
    r = conflict_aware_lineage_stub([("a", "b", "conflict")])
    assert r["conflicts"] == 1


def test_semantic_replay_archive() -> None:
    assert semantic_replay_archive_stub(["t"])["indexed"] == 1


def test_temporal_errata_edge() -> None:
    assert temporal_errata_edge_stub("e1", "e2") == ("e1", "e2")


def test_tournament_investigation() -> None:
    assert tournament_investigation_stub("inv1")["investigation_id"] == "inv1"
