"""Replay diagnostics (live + ingestion archives)."""

from __future__ import annotations

from app.observability.live_runtime import (
    replay_consistency_monitoring_stub,
    replay_diagnostics_live_stub,
)
from tcg_judge_ingestion.semantic_replay_archives import semantic_replay_archive_stub
from tcg_judge_ingestion.timing_edgecase_repositories import timing_edgecase_repo_stub


def test_replay_diag_alert() -> None:
    assert replay_diagnostics_live_stub("rid", 0.1)["alert"] is False


def test_semantic_archive_index() -> None:
    assert semantic_replay_archive_stub(["a", "a"])["indexed"] == 1


def test_timing_repo() -> None:
    assert timing_edgecase_repo_stub(["z", "a"]) == ["a", "z"]


def test_consistency_monitor() -> None:
    assert replay_consistency_monitoring_stub("h", "h")["consistent"] is True
