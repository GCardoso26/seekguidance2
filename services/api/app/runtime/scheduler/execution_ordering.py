"""Ordenação de execução derivada de precedência IR."""

from __future__ import annotations


def order_from_precedence(precedence: list[str], roles: list[str]) -> list[str]:
    prec_index = {p: i for i, p in enumerate(precedence)}
    return sorted(dict.fromkeys(roles), key=lambda r: (prec_index.get(r, 999), r))
