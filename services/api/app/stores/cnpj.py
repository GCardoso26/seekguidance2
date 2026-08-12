"""Validação e normalização de CNPJ (Brasil)."""

from __future__ import annotations

import re

_CNPJ_DIGITS_RE = re.compile(r"\D+")


def only_digits(value: str | None) -> str:
    return _CNPJ_DIGITS_RE.sub("", value or "")


def format_cnpj(digits: str) -> str:
    d = only_digits(digits)
    if len(d) != 14:
        return d
    return f"{d[:2]}.{d[2:5]}.{d[5:8]}/{d[8:12]}-{d[12:]}"


def is_valid_cnpj(value: str | None) -> bool:
    d = only_digits(value)
    if len(d) != 14 or d == d[0] * 14:
        return False

    def _check(base: str, weights: list[int]) -> int:
        total = sum(int(n) * w for n, w in zip(base, weights, strict=True))
        rest = total % 11
        return 0 if rest < 2 else 11 - rest

    w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    d1 = _check(d[:12], w1)
    d2 = _check(d[:12] + str(d1), w2)
    return d[-2:] == f"{d1}{d2}"


def require_valid_cnpj(value: str | None) -> str:
    """Retorna CNPJ formatado ou levanta ValueError."""
    if not is_valid_cnpj(value):
        raise ValueError("CNPJ inválido")
    return format_cnpj(only_digits(value))
