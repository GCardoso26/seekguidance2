"""Runtime de produção (app.runtime)."""

from __future__ import annotations

from app.runtime.production_runtime import (
    degradation_strategy,
    deterministic_replay_reconstruct_stub,
    orchestrate_runtime_stub,
    replay_governance_integration_stub,
    runtime_backpressure,
    runtime_compaction_hint,
    runtime_cost_hint,
    runtime_health_ping,
    supervisor_status,
)


def test_orchestrator() -> None:
    o = orchestrate_runtime_stub(replay_workers=2, semantic_workers=1, graph_workers=1)
    assert o["balanced"] is True


def test_supervisor() -> None:
    assert supervisor_status(heartbeats_ok=4, total=4)["healthy_ratio"] == 1.0


def test_backpressure() -> None:
    assert runtime_backpressure(0.96) == "hard"


def test_degradation() -> None:
    assert degradation_strategy("hard")["graph"] == "collapse"


def test_recovery() -> None:
    ev = deterministic_replay_reconstruct_stub([{"tick": 2, "x": 1}, {"tick": 1, "x": 0}])
    assert ev[0]["tick"] == 1


def test_compaction() -> None:
    c = runtime_compaction_hint(100, target=20)
    assert c["after"] == 20


def test_cost() -> None:
    assert runtime_cost_hint(100, 50)["over_budget"] is True


def test_health() -> None:
    assert runtime_health_ping(True)["ok"] is True


def test_replay_governance_integration() -> None:
    g = replay_governance_integration_stub("r1", "h", "h")
    assert g["production_ready"] is True


