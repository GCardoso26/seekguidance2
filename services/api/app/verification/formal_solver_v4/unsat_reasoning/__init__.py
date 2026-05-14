"""Raciocínio UNSAT explicável."""

from __future__ import annotations

from typing import Any


def unsat_explanation_payload(reason: str) -> dict[str, Any]:
    return {
        "unsat": True,
        "reason": reason,
        "assistant_explanation": "O cenário não admite todas as restrições ao mesmo tempo; verifique prioridades.",
    }
