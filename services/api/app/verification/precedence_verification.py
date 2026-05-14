"""Verificação de precedência e ordering."""

from __future__ import annotations


def verify_precedence_order(ordering: list[str]) -> dict[str, object]:
    no_cycle = len(ordering) == len(set(ordering))
    return {"precedence_legal": no_cycle, "ordering_size": len(ordering)}
