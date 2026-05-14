"""Confiança em rulings ingeridos (fonte + parser)."""

from __future__ import annotations


def ruling_confidence(*, official: bool, parser_ok: bool, citations: int) -> float:
    base = 0.85 if official else 0.45
    if not parser_ok:
        base *= 0.7
    bonus = min(0.1, 0.02 * max(0, citations))
    return round(min(1.0, base + bonus), 4)
