"""Invariantes de legalidade de transição."""

from __future__ import annotations


def check_legality_invariants(*, precedence_legal: bool, deterministic: bool) -> list[str]:
    violations: list[str] = []
    if not precedence_legal:
        violations.append("precedence_illegal")
    if not deterministic:
        violations.append("non_deterministic_replay")
    return violations
