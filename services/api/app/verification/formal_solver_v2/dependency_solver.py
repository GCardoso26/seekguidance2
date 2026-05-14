"""Dependências: ciclo = explicação jogável."""

from __future__ import annotations

from typing import Any

from app.verification.formal_solver.theorems import dependency_satisfiability_stub


def dependency_solver_assistant(edges: list[tuple[str, str]]) -> dict[str, Any]:
    tech = dependency_satisfiability_stub(edges)
    sat = bool(tech.get("sat"))
    return {
        "ok": sat,
        "assistant_note": "Sem ciclos nas dependências declaradas."
        if sat
        else "Possível ciclo de dependências: explique ao jogador como quebrar o laço com regras do TCG.",
        "internal": tech,
    }
