"""Consistência de replay cross-device (stub)."""

from __future__ import annotations

from typing import Any


def cross_device_replay_consistency_stub(devices: int) -> dict[str, Any]:
    return {
        "devices": devices,
        "assistant_notes": ["Vector clock simplificado; sem colapsar identidades de jogadores."],
        "replay_summary": {"consistent": devices <= 4},
        "deterministic_alignment": {"order": "stable-device-ids"},
        "lineage_replay_awareness": {"slice": "cdrc-v0"},
    }
