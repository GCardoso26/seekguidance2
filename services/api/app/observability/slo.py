"""Objetivos SLO (latência e determinismo)."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class SloTargets:
    retrieval_p95_ms: float
    reasoning_p95_ms: float
    replay_determinism_min: float


def evaluate_latency_slo(*, p95_ms: float, target_ms: float) -> bool:
    return p95_ms <= target_ms


def evaluate_replay_slo(*, determinism_score: float, min_score: float) -> bool:
    return determinism_score >= min_score
