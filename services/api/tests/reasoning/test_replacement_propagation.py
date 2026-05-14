"""Replacement propagation bounded."""

from __future__ import annotations

from app.reasoning.exhaustive_validation import bounded_replacement_propagation, replacement_loop_legality


def test_bounded_propagation() -> None:
    g = {"a": ["b"], "b": ["c"], "c": []}
    out = bounded_replacement_propagation("a", g)
    assert "a" in out["visited"]


def test_loop_legality_empty() -> None:
    assert replacement_loop_legality({})["acyclic_stub"] is True
