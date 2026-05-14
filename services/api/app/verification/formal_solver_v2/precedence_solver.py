"""Precedência: saída orientada a jogador/juíz."""

from __future__ import annotations

from typing import Any

from app.verification.formal_solver.theorems import precedence_satisfiability_stub


def precedence_assistant(ordered: list[str], *, blocked: set[str] | None = None) -> dict[str, Any]:
    tech = precedence_satisfiability_stub(ordered, blocked or set())
    ok = bool(tech.get("sat"))
    return {
        "ok": ok,
        "assistant_steps": [
            "Confirmar ordem de empilhamento/resolução do jogo.",
            "Rever triggers independentes e bloqueios declarados.",
        ],
        "internal": tech,
    }
