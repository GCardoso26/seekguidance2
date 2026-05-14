"""Reconciliação do runtime móvel com servidor (stub)."""

from __future__ import annotations

from typing import Any

from app.mobile_runtime._judge_mobile_payload import judge_mobile_core_payload


def mobile_runtime_reconciliation_stub(slice_id: str) -> dict[str, Any]:
    return judge_mobile_core_payload(
        replay_summary={"slice_id": slice_id, "pending": 0},
        sync_hints=["Aplicar merge três-vias assistido quando heads divergem."],
        deterministic_alignment={"token": f"mrr-{slice_id}"},
        mobile_constraints={"verify_hash": True},
        offline_confidence=0.6,
        assistant_notes=["Reconciliação explicável; ruling humano fora de auto-merge."],
        lineage_replay_slice=f"mrr-{slice_id}",
        extras={
            "reconciliation_notes": ["stub-operational"],
            "replay_confidence": 0.71,
        },
    )
