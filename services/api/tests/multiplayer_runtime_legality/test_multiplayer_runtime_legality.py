"""Multiplayer runtime legality."""

from __future__ import annotations

from app.verification.formal_solver_v5 import bounded_multiplayer_search_payload


def test_multiplayer_legality_payload() -> None:
    p = bounded_multiplayer_search_payload(players=4, budget=8)
    assert p["legality_certificate"] is True
