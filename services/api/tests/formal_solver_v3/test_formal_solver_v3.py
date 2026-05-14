"""Formal solver V3."""

from __future__ import annotations

from app.verification.formal_solver_v3 import (
    formal_explainability_bundle,
    hidden_dependency_hints,
    legality_proof_payload,
    multiplayer_legality_payload,
    paradox_certificate,
    replacement_recursion_payload,
    timing_certificate_stub,
    z3_deterministic_bridge,
)


def test_z3_bridge() -> None:
    b = z3_deterministic_bridge()
    assert "deterministic" in b


def test_legality_proof() -> None:
    p = legality_proof_payload({"legal": True})
    assert "legality_reasoning" in p


def test_timing_cert() -> None:
    t = timing_certificate_stub(segoc_ok=True, apnap_ok=True, simultaneous_ok=False)
    assert t["segoc_ok"] is True


def test_paradox() -> None:
    assert paradox_certificate(True)["contradictory"] is True


def test_explainability_bundle() -> None:
    b = formal_explainability_bundle(
        legality_reasoning="ok",
        proof_steps=["s1"],
        solver_confidence=0.9,
    )
    assert b["for_end_user"] is True


def test_hidden_dep() -> None:
    assert "assistant_note" in hidden_dependency_hints([("a", "b")])


def test_replacement_payload() -> None:
    r = replacement_recursion_payload(["x", "x"])
    assert r["loop_risk"] is True


def test_multiplayer_payload() -> None:
    m = multiplayer_legality_payload(3, 1)
    assert "assistant_note" in m
