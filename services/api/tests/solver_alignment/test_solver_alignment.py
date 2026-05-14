"""Solver vs runtime alignment."""

from __future__ import annotations

from app.verification.formal_solver_v4 import cross_runtime_legality_stub, solver_replay_alignment_stub
from app.verification.formal_solver_v5 import cross_runtime_legality_v5_payload


def test_solver_replay_alignment() -> None:
    assert solver_replay_alignment_stub("claim", "claim")["agree"] is True


def test_cross_runtime_legality_alignment() -> None:
    assert cross_runtime_legality_stub(False, True)["aligned"] is False


def test_cross_runtime_v5_hashes() -> None:
    assert cross_runtime_legality_v5_payload("h", "h")["replay_legality_certificate"] is True
