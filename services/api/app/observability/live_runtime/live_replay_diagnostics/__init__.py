"""Replay diagnostics live (anomalias)."""

from __future__ import annotations

from typing import Any


def live_replay_anomaly_stub(score: float) -> dict[str, Any]:
    return {"anomaly": score > 0.85, "score": score, "assistant_notes": ["Correlacionar com replay_governance."]}
