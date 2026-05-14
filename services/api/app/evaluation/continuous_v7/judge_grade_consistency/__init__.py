"""Consistência judge-grade (v7)."""

from __future__ import annotations

from typing import Any


def judge_grade_consistency_v7_stub(score: float) -> dict[str, Any]:
    return {
        "score": score,
        "trend_analysis": "stable" if score > 0.8 else "review",
        "historical_scoring": [score],
        "assistant_notes": ["Medição contínua; não substitui juiz humano."],
    }
