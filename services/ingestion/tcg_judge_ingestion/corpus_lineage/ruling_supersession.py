"""Rulings suplantados (ordem lexical determinística)."""

from __future__ import annotations


def superseded_ruling_ids(pairs: list[tuple[str, str]]) -> list[str]:
    """pairs: (old_id, new_id) — devolve olds suplantados."""
    return sorted({o for o, _n in pairs})
