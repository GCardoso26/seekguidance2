"""Lineage de replay offline alinhado a snapshots incrementais (stub)."""

from __future__ import annotations

from collections.abc import Mapping
from typing import Any

from app.mobile_runtime._judge_mobile_payload import attach_storage_operational_fields, judge_mobile_core_payload


def offline_replay_lineage_v2_stub(
    replay_id: str,
    *,
    lineage: Mapping[str, Any] | None = None,
) -> dict[str, Any]:
    base = judge_mobile_core_payload(
        replay_summary={"replay_id": replay_id, "offline_lineage": True, "lineage": dict(lineage or {})},
        sync_hints=["Priorizar heads com hash determinístico antes de merge."],
        deterministic_alignment={"token": f"orl-{replay_id}"},
        mobile_constraints={"journal": True},
        offline_confidence=0.63,
        assistant_notes=[
            "Offline lineage-aware; sem equivalência forte cross-TCG.",
            "Explainability-first; reasoning_v* no servidor.",
        ],
        lineage_replay_slice=f"orl-{replay_id}",
    )
    return attach_storage_operational_fields(
        base,
        storage_status={"layer": "offline_replay_lineage_v2"},
        integrity_status={"hash_chain": "stub"},
        replay_alignment={"merge": "three_way_assisted"},
        lineage_snapshot={"anchors": 1},
        offline_constraints=["Não exportar ruling sem confirmação humana."],
    )
