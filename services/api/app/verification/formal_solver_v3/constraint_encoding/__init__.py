"""Encoding de constraints (delega resumo jogável ao V2)."""

from __future__ import annotations

from typing import Any

from app.verification.formal_solver_v2.legality_constraint_encoding import encode_legality_for_assistant


def encode_constraints_v3(tags: list[str]) -> dict[str, Any]:
    return encode_legality_for_assistant(tags)
