"""Legalidade de cadeia (genérico + nota soft)."""

from __future__ import annotations

from typing import Any


def chain_legality_stub(chain: list[str], *, game: str) -> dict[str, Any]:
    return {
        "game": game,
        "chain": chain,
        "assistant_note": "Validar cadeia com regras locais do TCG; sem equivalência cross-game.",
    }
