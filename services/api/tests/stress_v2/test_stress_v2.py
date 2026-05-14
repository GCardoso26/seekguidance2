"""Stress v2 — orçamentos e caps (smoke leve)."""

from __future__ import annotations

from app.runtime.explosion_control_v4 import (
    adaptive_entropy_runtime_stub,
    distributed_pruning_stub,
    multiplayer_branch_caps_stub,
    replay_explosion_forecast_stub,
    runtime_emergency_brakes_stub,
    temporal_replay_compaction_stub,
)
from app.verification.formal_solver_v4 import bounded_exhaustive_legality_stub, bounded_legality_search


def test_bounded_search_under_stress() -> None:
    r = bounded_legality_search(list("abcdefghijklmnop"), budget=4)
    assert r["visited"] == 4


def test_exhaustion_budget() -> None:
    assert bounded_exhaustive_legality_stub(candidates=1000, budget=5)["exhausted"] is False


def test_explosion_caps_stack() -> None:
    assert multiplayer_branch_caps_stub(players=3, branches=200, cap=50)["capped"] is True
    assert replay_explosion_forecast_stub(replay_nodes=5, cap=10)["forecast"] == "stable"
    assert temporal_replay_compaction_stub(timelines=20, max_kept=5)["compacted"] == 15
    assert adaptive_entropy_runtime_stub(64.0)["risk_score"] == 1.0
    assert runtime_emergency_brakes_stub(cpu_pressure=0.95, queue_depth=2)["triggered"] is True
    assert distributed_pruning_stub(worker_shards=8, prune_ratio=0.25)["prune_ratio"] == 0.25
