"""Compilação de asserções de legalidade/timing para IR formal."""

from __future__ import annotations

from typing import Any

from app.verification.formal_solver.constraint_ir import Constraint, FormalIR, Var
from app.verification.formal_solver.smt_abstraction import solve_stub


def compile_legality_ir(flags: dict[str, bool]) -> FormalIR:
    ir = FormalIR(metadata={"kind": "legality"})
    for name, val in flags.items():
        ir.variables.append(Var(name, "bool"))
        ir.constraints.append(Constraint("eq", (name, val)))
    return ir


def compile_timing_ir(windows_ok: dict[str, bool]) -> FormalIR:
    ir = FormalIR(metadata={"kind": "timing"})
    for w, ok in windows_ok.items():
        ir.variables.append(Var(f"win::{w}", "bool"))
        ir.constraints.append(Constraint("eq", (f"win::{w}", ok)))
    return ir


def verify_compiled(ir: FormalIR) -> dict[str, Any]:
    return solve_stub(ir)
