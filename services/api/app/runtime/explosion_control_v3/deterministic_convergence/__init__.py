"""Convergência determinística."""

from __future__ import annotations


def deterministic_convergence_ok(stable_hashes: list[str]) -> bool:
    return len(set(stable_hashes)) <= 1
