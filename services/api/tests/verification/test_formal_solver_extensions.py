"""Extensões formal_solver."""

from __future__ import annotations

from app.verification.formal_solver import detect_replacement_loop_hints, external_solver_status


def test_replacement_loop_hint() -> None:
    r = detect_replacement_loop_hints(["a", "b", "a"])
    assert r["loop_risk"] is True


def test_external_solver_status_shape() -> None:
    s = external_solver_status()
    assert "z3_available" in s
