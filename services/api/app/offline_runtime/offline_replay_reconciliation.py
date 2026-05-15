"""Reconciliação de replay offline com hints determinísticos (stub)."""

from __future__ import annotations

from collections.abc import Mapping
from typing import Any

from app.mobile_runtime._judge_mobile_payload import attach_storage_operational_fields, judge_mobile_core_payload


def offline_replay_reconciliation_stub(
    slice_id: str,
    *,
    lineage: Mapping[str, Any] | None = None,
) -> dict[str, Any]:
    base = judge_mobile_core_payload(
        replay_summary={"slice_id": slice_id, "lineage": dict(lineage or {})},
        sync_hints=["Três-vias assistido; ruling humano obrigatório."],
        deterministic_alignment={"token": f"orr-{slice_id}"},
        mobile_constraints={"journal": True},
        offline_confidence=0.64,
        assistant_notes=["Replay offline reconciliado com governança incremental."],
        lineage_replay_slice=f"orr-{slice_id}",
    )
    return attach_storage_operational_fields(
        base,
        storage_status={"layer": "offline_replay_reconciliation"},
        integrity_status={"hash": "stub"},
        replay_alignment={"merge": "assisted"},
        lineage_snapshot={"anchors": 1},
        offline_constraints=["Sem auto-merge silencioso."],
    )
