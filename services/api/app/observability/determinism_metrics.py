"""Métricas de determinismo."""

from __future__ import annotations

from typing import Any


def record_determinism_score(score: float) -> dict[str, Any]:
    return {"determinism_score": round(float(score), 6)}
