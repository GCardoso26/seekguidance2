"""Métricas de replay determinístico."""

from __future__ import annotations

from typing import Any

from app.runtime.replay.replay_validation import validate_replay


def replay_hash_distance(h1: str, h2: str) -> int:
    n = min(len(h1), len(h2))
    diff = sum(1 for i in range(n) if h1[i] != h2[i])
    return diff + abs(len(h1) - len(h2))


def replay_determinism_score(payload: dict[str, Any], *, runs: int = 3) -> dict[str, Any]:
    """Agrega `validate_replay` num score simples 0–1."""
    out = validate_replay(payload, runs=runs)
    score = 1.0 if out.get("deterministic") else float(out.get("mutation_consistency") or 0.0)
    return {"score": score, **out}