"""Validação exaustiva limitada de flags de legalidade (contradições explícitas)."""

from __future__ import annotations


def detect_flag_contradictions(flags: dict[str, bool]) -> list[str]:
    """Detecta pares `x` e `not_x` incompatíveis (`not_x` deve ser a negação lógica de `x`)."""
    out: list[str] = []
    for k, v in flags.items():
        if k.startswith("not_"):
            continue
        nk = f"not_{k}"
        if nk in flags and flags[nk] == v:
            out.append(f"{k} vs {nk}")
    return out
