"""Diagnósticos live de replay."""

from __future__ import annotations

from typing import Any


def replay_diagnostics_live_stub(replay_id: str, drift_score: float) -> dict[str, Any]:
    return {
        "replay_id": replay_id,
        "drift_score": drift_score,
        "alert": drift_score > 0.35,
        "assistant_notes": ["Instabilidade de replay deve acionar diff viewer, não silent retry infinito."],
    }
