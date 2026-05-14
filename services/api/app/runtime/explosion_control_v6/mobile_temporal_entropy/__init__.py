"""Entropia temporal móvel (v6 stub)."""

from __future__ import annotations

from typing import Any


def mobile_temporal_entropy_stub(ticks: int) -> dict[str, Any]:
    return {
        "ticks": ticks,
        "entropy_score": min(1.0, ticks / 200.0),
        "assistant_notes": ["Temporal entropy guia degradação; sem equivalência cross-TCG."],
        "replay_summary": {"window": min(ticks, 120)},
        "deterministic_alignment": {"token": "mte-v6"},
    }
