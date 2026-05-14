"""Camada de abstração SMT (sem Z3 obrigatório)."""

from __future__ import annotations

from typing import Any

from app.verification.formal_solver.constraint_ir import Constraint, FormalIR, Var


def build_stub_problem(*, game_slug: str) -> FormalIR:
    """Problema mínimo: variáveis de legalidade + conjunção vazia extensível."""
    return FormalIR(
        variables=[Var("legal"), Var("timing_ok", "bool")],
        constraints=[
            Constraint("implies", ("timing_ok", "legal")),
        ],
        metadata={"game_slug": game_slug, "backend": "stub"},
    )


def encode_assertions(assertions: dict[str, bool]) -> FormalIR:
    """Converte flags de asserção em IR (AND de igualdades a true)."""
    ir = FormalIR(metadata={"source": "legality_flags"})
    for k, v in assertions.items():
        ir.variables.append(Var(k, "bool"))
        ir.constraints.append(Constraint("eq", (k, v)))
    return ir


def solve_stub(ir: FormalIR) -> dict[str, Any]:
    """Stub: SAT se não existir contradição explícita eq(x, True) e eq(x, False)."""
    vals: dict[str, bool | None] = {}
    for c in ir.constraints:
        if c.kind == "eq" and len(c.args) == 2:
            name, val = c.args[0], c.args[1]
            if isinstance(name, str) and isinstance(val, bool):
                if name in vals and vals[name] is not None and vals[name] != val:
                    return {"sat": False, "model": {}, "proof": "contradiction"}
                vals[name] = val
    return {"sat": True, "model": vals, "proof": "stub_trivial"}
