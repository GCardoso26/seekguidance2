"""Encoding de legalidade para diagnóstico (resumo, não CNF ao utilizador)."""

from __future__ import annotations

from typing import Any


def encode_legality_for_assistant(constraints: list[str]) -> dict[str, Any]:
    return {
        "n_constraints": len(constraints),
        "summary": "Estado verificado contra " + str(len(constraints)) + " restrições declaradas.",
        "for_developer_only": {"tags": sorted(constraints)},
    }
