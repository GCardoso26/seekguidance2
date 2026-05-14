"""Temporal legality (formal v5)."""

from __future__ import annotations

from app.verification.formal_solver_v5 import temporal_legality_solver_payload


def test_temporal_legality_solver() -> None:
    assert temporal_legality_solver_payload([1, 2, 3])["timing_certificate"] is True
