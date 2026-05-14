"""Runtime sensível à bateria (stub)."""

from __future__ import annotations

from typing import Any


def mobile_battery_runtime_stub(level_pct: int) -> dict[str, Any]:
    low = level_pct < 20
    return {
        "battery_pct": level_pct,
        "replay_summary": {"throttle": low},
        "assistant_notes": ["Throttling afeta FPS/telemetria, não ordem lógica persistida."],
        "sync_hints": ["Pausar uploads não críticos se low."],
        "deterministic_alignment": {"mode": "battery-aware"},
        "mobile_constraints": {"low_power": low},
        "offline_confidence": 0.44 if low else 0.7,
        "lineage_replay_awareness": {"slice": "mbr-v0"},
    }
