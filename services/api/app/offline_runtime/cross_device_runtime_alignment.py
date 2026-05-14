"""Alinhamento cross-device (stub)."""

from __future__ import annotations

from typing import Any

from app.offline_runtime._offline_payload import offline_judge_payload


def cross_device_runtime_alignment_stub(devices: int) -> dict[str, Any]:
    return offline_judge_payload(
        replay_summary={"devices": devices},
        sync_hints=["Broadcast de slice_id em torneio apenas quando política permitir."],
        deterministic_alignment={"vector_clock_stub": [1, 1, 1][:devices]},
        mobile_constraints={"max_devices": 8},
        offline_confidence=0.5,
        assistant_notes=["Cross-device não colapsa jogadores em identidade forte."],
        lineage_replay_slice="cdra-v0",
        offline_limitations=["Vetor de relógios simplificado em stub"],
        sync_conflicts=[],
        replay_alignment={"consistent": devices <= 4},
        extras={
            "sync_confidence": 0.55,
            "replay_delta_summary": {"fanout": devices},
            "conflict_resolution_notes": [],
            "deterministic_merge_hints": ["slice_primary_device"],
        },
    )
