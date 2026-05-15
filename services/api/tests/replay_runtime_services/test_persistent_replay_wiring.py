"""Imports e chaves mínimas dos serviços de replay persistente."""

from __future__ import annotations

from app.runtime.persistent_replay_runtime import replay_runtime_service_stub


def test_replay_runtime_service_payloads() -> None:
    out = replay_runtime_service_stub("r1")
    assert "replay_runtime_summary" in out
    assert "lineage_runtime_summary" in out
    assert "reconciliation_summary" in out
    assert "replay_health_summary" in out
    assert "deterministic_replay_alignment" in out
