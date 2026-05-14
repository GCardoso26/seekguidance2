"""Controlos de custo de replay móvel v2 (stub)."""

from __future__ import annotations

from typing import Any


def mobile_replay_cost_controls_v2_stub(battery_low: bool) -> dict[str, Any]:
    return {
        "battery_low": battery_low,
        "assistant_notes": ["Custos orientam sampling e prefetch; não alteram eventos persistidos."],
        "replay_summary": {"throttle": battery_low},
        "deterministic_alignment": {"token": "mrcc2"},
        "lineage_replay_awareness": {"slice": "mrcc2"},
    }
