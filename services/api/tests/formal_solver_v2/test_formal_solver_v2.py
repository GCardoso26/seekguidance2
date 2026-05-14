"""Formal solver V2 — diagnósticos jogáveis."""

from __future__ import annotations

from app.verification.formal_solver_v2 import (
    dependency_solver_assistant,
    encode_legality_for_assistant,
    encode_timing_for_assistant,
    multiplayer_consistency_assistant,
    paradox_assistant_hint,
    precedence_assistant,
    replacement_loop_assistant,
    smt_bridge_status,
)


def test_smt_bridge_has_assistant_note() -> None:
    s = smt_bridge_status()
    assert "assistant_note" in s


def test_precedence_assistant() -> None:
    r = precedence_assistant(["a", "b"], blocked=set())
    assert "assistant_steps" in r


def test_dependency() -> None:
    r = dependency_solver_assistant([("a", "b"), ("b", "c")])
    assert "assistant_note" in r


def test_paradox() -> None:
    r = paradox_assistant_hint({"x": True, "y": True})
    assert r["paradox_risk"] is True


def test_replacement() -> None:
    r = replacement_loop_assistant(["e", "e"])
    assert r["loop_risk"] is True


def test_multiplayer() -> None:
    r = multiplayer_consistency_assistant(4, 2)
    assert "assistant_note" in r


def test_encode_legality() -> None:
    r = encode_legality_for_assistant(["a", "b"])
    assert r["n_constraints"] == 2


def test_encode_timing() -> None:
    r = encode_timing_for_assistant(["open", "closed"])
    assert "open" in r["windows"]
