"""Diagnósticos de replay móvel v2 (stub)."""

from __future__ import annotations

from typing import Any


def mobile_replay_diagnostics_v2_stub(replay_id: str) -> dict[str, Any]:
    return {
        "replay_id": replay_id,
        "assistant_notes": ["Histogramas de chunk miss e branch depth agregados."],
        "replay_summary": {"anomalies": 0},
        "deterministic_alignment": {"token": f"mrd2-{replay_id}"},
        "lineage_replay_awareness": {"slice": "mrd2"},
    }
