"""Estabilidade de provas formais."""

from __future__ import annotations


def proof_stability_index(runs_match: bool) -> float:
    return 1.0 if runs_match else 0.4
