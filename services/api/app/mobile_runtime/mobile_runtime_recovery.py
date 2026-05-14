"""Recuperação de runtime móvel após crash/OOM (stub)."""

from __future__ import annotations

from typing import Any

from app.mobile_runtime._judge_mobile_payload import judge_mobile_core_payload


def mobile_runtime_recovery_stub(last_slice: str) -> dict[str, Any]:
    return judge_mobile_core_payload(
        replay_summary={"last_good_slice": last_slice, "recovery": "resume_from_checkpoint"},
        sync_hints=["Revalidar chunk após recovery.", "Marcar hotspot para observabilidade."],
        deterministic_alignment={"checkpoint_token": f"rcv-{last_slice}"},
        mobile_constraints={"retry_backoff_ms": 250},
        offline_confidence=0.64,
        assistant_notes=["Resume determinístico desde que checkpoint e hash coincidam."],
        lineage_replay_slice=f"recovery-{last_slice}",
    )
