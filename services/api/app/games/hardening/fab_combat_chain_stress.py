"""Stress de combat chain FAB."""

from __future__ import annotations


def fab_chain_pressure(*, reaction_windows: int) -> dict[str, object]:
    return {"pressure": reaction_windows > 5, "reaction_windows": reaction_windows}
