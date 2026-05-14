"""Backpressure de sync (stub)."""

from __future__ import annotations

from typing import Any

from app.offline_runtime._offline_payload import offline_judge_payload


def sync_backpressure_runtime_stub(pressure: float) -> dict[str, Any]:
    throttle = pressure > 0.75
    return offline_judge_payload(
        replay_summary={"pressure": pressure, "throttle": throttle},
        sync_hints=["Reduzir batch size dinamicamente.", "Pausar analytics primeiro."],
        deterministic_alignment={"bp_token": "sbp-v0"},
        mobile_constraints={"max_inflight": 2 if throttle else 6},
        offline_confidence=0.49 if throttle else 0.68,
        assistant_notes=["Backpressure preserva ordem lógica enfileirada."],
        lineage_replay_slice="sbp-v0",
        offline_limitations=["Throughput reduzido sob pressão"],
        sync_conflicts=[],
        replay_alignment={"stable_queue": True},
        extras={
            "sync_confidence": 0.5 if throttle else 0.75,
            "replay_delta_summary": {"throttled": throttle},
            "conflict_resolution_notes": [],
            "deterministic_merge_hints": ["preserve_queue_order"],
        },
    )
