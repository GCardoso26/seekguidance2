"""Formal legality v2 (solver payloads)."""

from __future__ import annotations

from app.verification.formal_solver_v4 import (
    bounded_multiplayer_proof_stub,
    cross_runtime_legality_stub,
    deterministic_solver_alignment_stub,
    proof_reduction_stub,
    replacement_recursion_bounds_stub,
    replay_legality_proofs_stub,
    semantic_unsat_analysis_stub,
    solver_replay_alignment_stub,
    timing_fixedpoint_analysis_stub,
)


def test_bounded_multiplayer_proof() -> None:
    p = bounded_multiplayer_proof_stub(players=3, budget=5)
    assert "legality_certificate" in p


def test_replacement_bounds() -> None:
    assert replacement_recursion_bounds_stub(2, 5)["within_bounds"] is True


def test_timing_fixedpoint() -> None:
    assert len(timing_fixedpoint_analysis_stub(["e1", "e2"])["proof_steps"]) == 2


def test_cross_runtime() -> None:
    assert cross_runtime_legality_stub(True, True)["aligned"] is True


def test_replay_legality_proofs() -> None:
    assert replay_legality_proofs_stub("rid", True)["ok"] is True


def test_deterministic_alignment() -> None:
    assert deterministic_solver_alignment_stub("h", "h")["match"] is True


def test_semantic_unsat() -> None:
    u = semantic_unsat_analysis_stub("timing")
    assert u["unsat"] is True


def test_proof_reduction() -> None:
    assert proof_reduction_stub(["a", "b", "c"], max_steps=2)["reduced"] == 2


def test_solver_replay_alignment() -> None:
    assert solver_replay_alignment_stub("x", "x")["agree"] is True
