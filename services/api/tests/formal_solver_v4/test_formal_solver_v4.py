"""Formal solver V4."""

from __future__ import annotations

from app.verification.formal_solver_v4 import (
    bounded_legality_search,
    chain_legality_stub,
    compress_legality_proof,
    fab_combat_chain_legality_stub,
    legality_saturation_stub,
    multiplayer_legality_exhaustion_stub,
    replacement_recursion_bounded,
    semantic_contradiction_stub,
    solver_runtime_safeguards,
    timing_exhaustion_stub,
    unsat_explanation_payload,
    yugioh_chain_legality_stub,
)


def test_bounded_search() -> None:
    r = bounded_legality_search(list("abcdefghij"), budget=5)
    assert r["visited"] == 5


def test_saturation() -> None:
    assert legality_saturation_stub(10, 5)["saturated"] is True


def test_timing_exhaust() -> None:
    assert timing_exhaustion_stub(["a", "b", "c"], cap=2)["exhausted"] is True


def test_multiplayer_exhaust() -> None:
    m = multiplayer_legality_exhaustion_stub(2, 5)
    assert m["exhaustion"] is True


def test_replacement_bounded() -> None:
    r = replacement_recursion_bounded(["x", "x"], cap=5)
    assert "loop_risk" in r


def test_chain_stub() -> None:
    c = chain_legality_stub(["a"], game="ygo")
    assert c["game"] == "ygo"


def test_compress_proof() -> None:
    p = compress_legality_proof(["s1", "s2", "s3"], max_steps=2)
    assert len(p["human_readable_proof"]) == 2


def test_unsat() -> None:
    u = unsat_explanation_payload("timing")
    assert u["unsat"] is True


def test_safeguards() -> None:
    s = solver_runtime_safeguards(
        timeout_ms=40,
        recursion_depth=10,
        contradiction_budget=3,
        proof_compression_cap=4,
        emergency=False,
    )
    assert s["emergency_fallback"] is True


def test_semantic_contradiction() -> None:
    assert semantic_contradiction_stub({"a": True, "b": True})["contradictory"] is True


def test_ygo() -> None:
    y = yugioh_chain_legality_stub(segoc_ok=True, chain_blocks=False, hidden_timing_ok=True)
    assert y["ok"] is True


def test_fab() -> None:
    f = fab_combat_chain_legality_stub(reactions_open=True, layer_ok=True)
    assert f["ok"] is True
