"""Formal solver stub + provas mínimas."""

from __future__ import annotations

import pytest
from app.runtime.replay.formal_certification import certify_payload
from app.verification.exhaustive_legality import detect_flag_contradictions
from app.verification.formal_proofs import ProofGraph, ProofNode, replay_proof_certificate, validate_proof_graph
from app.verification.formal_solver import compile_legality_ir, solve_stub, verify_compiled
from app.verification.formal_solver.constraint_ir import Constraint, FormalIR, Var
from app.verification.timing_verification import all_windows_legal, bounded_orderings


def test_solve_stub_contradiction() -> None:
    ir = FormalIR(
        variables=[Var("x", "bool")],
        constraints=[Constraint("eq", ("x", True)), Constraint("eq", ("x", False))],
    )
    out = solve_stub(ir)
    assert out["sat"] is False


def test_compile_legality_ok() -> None:
    ir = compile_legality_ir({"a": True, "b": False})
    out = verify_compiled(ir)
    assert out["sat"] is True


def test_replay_proof_certificate() -> None:
    out = replay_proof_certificate({"k": 1}, runs=2)
    assert "certified" in out


def test_certify_payload_alias() -> None:
    c = certify_payload({"x": 2}, runs=2)
    assert c.get("certified") is not None


def test_proof_graph_validation() -> None:
    g = ProofGraph(nodes=[ProofNode("n1", "root")], edges=[])
    assert validate_proof_graph(g)["valid"]


def test_exhaustive_flags() -> None:
    assert detect_flag_contradictions({"a": True, "not_a": True}) == ["a vs not_a"]


def test_timing_bounded() -> None:
    assert all_windows_legal({"w1": True})["legal"]
    assert len(bounded_orderings(["a", "b"])) == 2


@pytest.mark.judge_grade
def test_judge_grade_formal_bundle() -> None:
    """Gate explícito judge-grade (formal + timing)."""
    ir = compile_legality_ir({"legal": True})
    assert verify_compiled(ir)["sat"] is True
