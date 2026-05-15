"""Observabilidade de sync de replay (stub v3)."""

from __future__ import annotations

from typing import Any


def replay_sync_observability_v3_stub(channel: str) -> dict[str, Any]:
    return {
        "channel": channel,
        "assistant_notes": ["Métricas agregadas de sync; sem dados sensíveis."],
        "replay_summary": {"sync_health": "observed_stub"},
    }
