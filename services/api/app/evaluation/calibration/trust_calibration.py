"""Calibração de confiança (judge / legality / replay / grafo) — stubs numéricos."""

from __future__ import annotations


def calibrate_judge_confidence(raw: float, floor: float = 0.05, ceil: float = 0.99) -> float:
    return max(floor, min(ceil, round(raw, 4)))


def calibrate_legality_score(sat: bool, depth: int) -> float:
    base = 0.85 if sat else 0.25
    return round(max(0.0, min(1.0, base - 0.01 * max(0, depth - 6))), 4)


def calibrate_replay_trust(deterministic: bool, mutation_score: float) -> float:
    return round(0.95 if deterministic else max(0.0, mutation_score), 4)


def calibrate_graph_confidence(edge_mean: float) -> float:
    return round(max(0.0, min(1.0, edge_mean)), 4)
