"""Ponte SMT/SAT: tenta Z3 quando disponível; relatório sempre em linguagem de mesa."""

from __future__ import annotations

from typing import Any

from app.verification.formal_solver.external_solvers import try_import_z3


def smt_bridge_status() -> dict[str, Any]:
    z3 = try_import_z3()
    if z3 is not None:
        return {
            "backend": "z3_available",
            "assistant_note": "Motor formal disponível para validações internas; respostas ao utilizador "
            "devem usar passos de jogo e não fórmulas.",
        }
    return {
        "backend": "stub_only",
        "assistant_note": "Instale Z3 opcionalmente para validações mais profundas; o assistente continua "
        "operacional com heurísticas determinísticas.",
    }
