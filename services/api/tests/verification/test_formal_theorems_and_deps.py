"""Teoremas stub + dependências."""

from __future__ import annotations

from app.verification.formal_solver import (
    dependency_satisfiability_stub,
    legality_theorem_stub,
    precedence_satisfiability_stub,
)


def test_legality_theorem() -> None:
    out = legality_theorem_stub({"x": True})
    assert out.get("sat") is True


def test_dependency_cycle() -> None:
    out = dependency_satisfiability_stub([("a", "b"), ("b", "a")])
    assert out["sat"] is False


def test_precedence_sat() -> None:
    out = precedence_satisfiability_stub(["p1", "p2"], set())
    assert out["sat"] is True
