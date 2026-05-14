"""Orçamento de mutações por passo."""

from __future__ import annotations


def cap_mutations(muts: list[object], cap: int) -> tuple[list[object], bool]:
    if len(muts) <= cap:
        return muts, False
    return muts[:cap], True
