"""Retry de operações de sync (stub)."""

from __future__ import annotations

from typing import Any

from app.offline_runtime._offline_payload import offline_judge_payload


def sync_retry_runtime_stub(attempts: int) -> dict[str, Any]:
    return offline_judge_payload(
        replay_summary={"attempts": attempts, "max_attempts": 5},
        sync_hints=["Marcar poison queue após max_attempts."],
        deterministic_alignment={"retry_id": f"sr-{attempts}"},
        mobile_constraints={"jitter_ms": 120},
        offline_confidence=0.45 if attempts > 3 else 0.7,
        assistant_notes=["Retries não duplicam eventos replay; idempotência por op_id."],
        lineage_replay_slice="sr-v0",
        offline_limitations=["Backoff aumenta latência observada"],
        sync_conflicts=[],
        replay_alignment={"idempotent": True},
        extras={
            "sync_confidence": 0.62,
            "replay_delta_summary": {"retries": attempts},
            "conflict_resolution_notes": [],
            "deterministic_merge_hints": ["idempotent_op_id"],
        },
    )
