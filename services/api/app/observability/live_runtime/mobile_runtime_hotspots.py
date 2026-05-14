"""Hotspots de CPU/memória no runtime móvel (stub)."""

from __future__ import annotations

from typing import Any


def mobile_runtime_hotspots_stub(name: str) -> dict[str, Any]:
    return {
        "hotspot": name,
        "replay_summary": {"top_frame_ms": 6.2},
        "assistant_notes": ["Hotspots guiam pruning mobile-safe; juiz vê causa provável."],
        "sync_hints": ["Anexar IDs de replay slice ao relatório."],
        "deterministic_alignment": {"symbolicate": "stub"},
        "mobile_constraints": {"sample_rate_hz": 20},
        "offline_confidence": 0.54,
        "lineage_replay_awareness": {"slice": f"mrh-{name}"},
    }
