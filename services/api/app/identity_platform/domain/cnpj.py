"""CNPJ validation (checksum only — no Receita Federal integration)."""

from __future__ import annotations


def normalize_cnpj(raw: str) -> str:
    return "".join(ch for ch in raw if ch.isdigit())


def is_valid_cnpj(raw: str) -> bool:
    cnpj = normalize_cnpj(raw)
    if len(cnpj) != 14 or cnpj == cnpj[0] * 14:
        return False

    def _digit(base: str, weights: list[int]) -> int:
        total = sum(int(n) * w for n, w in zip(base, weights, strict=True))
        rem = total % 11
        return 0 if rem < 2 else 11 - rem

    w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    d1 = _digit(cnpj[:12], w1)
    d2 = _digit(cnpj[:12] + str(d1), w2)
    return cnpj[-2:] == f"{d1}{d2}"
