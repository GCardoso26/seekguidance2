"""Observabilidade de replay no dispositivo (stub)."""

from __future__ import annotations

from typing import Any


def mobile_replay_observability_stub(replay_id: str) -> dict[str, Any]:
    return {
        "replay_id": replay_id,
        "replay_summary": {"virtualized_ticks": 200, "lazy": True},
        "assistant_notes": ["Diagnóstico de RAM por chunk; sem alterar determinismo salvo."],
        "sync_hints": ["Enviar apenas histogramas agregados."],
        "deterministic_alignment": {"chunk_hash_chain": "stub"},
        "mobile_constraints": {"max_ram_mb_soft": 320},
        "offline_confidence": 0.62,
        "lineage_replay_awareness": {"slice": f"mro-{replay_id}"},
        "branch_explosion_local": {"warn": False},
    }
