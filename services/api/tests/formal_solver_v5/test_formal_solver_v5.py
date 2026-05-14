"""Formal solver — payloads v4 estendidos (testes v5)."""

from __future__ import annotations

from app.verification.formal_solver_v4 import (
    bounded_exhaustive_legality_stub,
    combat_chain_validation_stub,
    hidden_dependency_resolution_stub,
    incremental_smt_legality_stub,
    multiplayer_legality_certificate_stub,
    persist_legality_proof_stub,
    replacement_fixedpoint_stub,
    segoc_validation_stub,
    timing_proof_search_stub,
    unsat_explainability_v2,
)


def test_incremental_smt_payload() -> None:
    p = incremental_smt_legality_stub(checkpoint_id="c1", delta_events=["e1"])
    assert "legality_reasoning" in p and "proof_steps" in p


def test_bounded_exhaustion() -> None:
    assert bounded_exhaustive_legality_stub(candidates=3, budget=10)["exhausted"] is True


def test_timing_proof_search() -> None:
    assert len(timing_proof_search_stub(["a", "b", "c"], depth_cap=2)["proof_steps"]) == 2


def test_replacement_fixedpoint() -> None:
    r = replacement_fixedpoint_stub(["x", "y"], max_depth=5)
    assert r["replay_legality_summary"]


def test_multiplayer_certificate() -> None:
    m = multiplayer_legality_certificate_stub(players=4, windows=2)
    assert m["players"] == 4


def test_segoc() -> None:
    assert segoc_validation_stub(mandatory_first=True, chains=1)["legality_reasoning"]


def test_combat_chain() -> None:
    assert combat_chain_validation_stub(open_reactions=True, link_depth=2)["proof_steps"]


def test_hidden_deps() -> None:
    h = hidden_dependency_resolution_stub(["n1", "n2"])
    assert "assistant_notes" in h


def test_proof_persist() -> None:
    p = persist_legality_proof_stub("pid", ["s1", "s2"])
    assert p["proof_id"] == "pid"


def test_unsat_v2() -> None:
    u = unsat_explainability_v2("timing", ["h1"])
    assert u["unsat"] is True
