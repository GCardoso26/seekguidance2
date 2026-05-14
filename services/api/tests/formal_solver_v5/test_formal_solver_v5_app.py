"""Formal solver v5 (app package)."""

from __future__ import annotations

from app.verification.formal_solver_v5 import (
    apnap_solver_payload,
    incremental_z3_runtime_payload,
    segoc_formal_validation_payload,
    solver_replay_alignment_v5_payload,
)


def test_incremental_z3_payload() -> None:
    p = incremental_z3_runtime_payload(checkpoint="c0")
    assert "legality_reasoning" in p and "proof_steps" in p


def test_segoc() -> None:
    assert segoc_formal_validation_payload(True)["timing_certificate"] is True


def test_apnap() -> None:
    assert apnap_solver_payload("p1", n_priority_passes=2)["solver_confidence"]


def test_solver_replay_v5() -> None:
    assert solver_replay_alignment_v5_payload("a", "a")["replay_legality_certificate"] is True
