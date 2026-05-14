"""Estabilidade de provas em runtime."""

from __future__ import annotations


def proof_stability_runtime(stable: bool) -> float:
    return 1.0 if stable else 0.55
