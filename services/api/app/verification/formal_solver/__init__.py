"""Formal solver package (SMT/SAT abstraction, sem dependências externas)."""

from app.verification.formal_solver.compiler import compile_legality_ir, compile_timing_ir, verify_compiled
from app.verification.formal_solver.external_solvers import external_solver_status, try_import_z3
from app.verification.formal_solver.multiplayer_stub import multiplayer_legality_sketch
from app.verification.formal_solver.recursion_hints import infinite_recursion_hint, symbolic_recursion_budget_stub
from app.verification.formal_solver.replacement_loop_detection import detect_replacement_loop_hints
from app.verification.formal_solver.smt_abstraction import build_stub_problem, encode_assertions, solve_stub
from app.verification.formal_solver.theorems import (
    dependency_satisfiability_stub,
    legality_theorem_stub,
    precedence_satisfiability_stub,
    timing_theorem_stub,
)

__all__ = [
    "build_stub_problem",
    "compile_legality_ir",
    "compile_timing_ir",
    "dependency_satisfiability_stub",
    "detect_replacement_loop_hints",
    "encode_assertions",
    "external_solver_status",
    "infinite_recursion_hint",
    "legality_theorem_stub",
    "multiplayer_legality_sketch",
    "precedence_satisfiability_stub",
    "solve_stub",
    "symbolic_recursion_budget_stub",
    "timing_theorem_stub",
    "try_import_z3",
    "verify_compiled",
]
