"""Fila offline de sync (stub)."""

from __future__ import annotations

from typing import Any

from app.offline_runtime._offline_payload import offline_judge_payload


def offline_sync_queue_stub(depth: int) -> dict[str, Any]:
    return offline_judge_payload(
        replay_summary={"depth": depth, "priority": ["replay", "ruling", "ontology"]},
        sync_hints=["Backoff exponencial com jitter.", "Coalescência de deltas adjacentes."],
        deterministic_alignment={"queue_token": "osq-v0"},
        mobile_constraints={"max_depth": 500},
        offline_confidence=0.53,
        assistant_notes=["Fila durável local; integridade antes de dequeue."],
        lineage_replay_slice="osq-v0",
        offline_limitations=["Sem garantia de ordem global sem servidor"],
        sync_conflicts=[],
        replay_alignment={"head": "local"},
        extras={
            "sync_confidence": max(0.3, 1.0 - 0.001 * depth),
            "replay_delta_summary": {"queued": depth},
            "conflict_resolution_notes": [],
            "deterministic_merge_hints": ["priority_replay_first"],
        },
    )
