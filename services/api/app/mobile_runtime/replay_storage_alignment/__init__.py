"""Alinhamento storage local vs referência remota (stub)."""

from __future__ import annotations

from typing import Any

from app.mobile_runtime._judge_mobile_payload import attach_storage_operational_fields, judge_mobile_core_payload


def replay_storage_alignment_stub(local_head: str, remote_head: str | None) -> dict[str, Any]:
    drift = remote_head is not None and local_head != remote_head
    base = judge_mobile_core_payload(
        replay_summary={"local_head": local_head, "remote_head": remote_head},
        sync_hints=["Se drift, abrir reconciliação assistida."],
        deterministic_alignment={"merge_hint": "three_way_stub"},
        mobile_constraints={"verify_before_write": True},
        offline_confidence=0.55 if drift else 0.78,
        assistant_notes=["Diff explicável; sem merge silencioso de ruling."],
        lineage_replay_slice="rsa-v0",
    )
    return attach_storage_operational_fields(
        base,
        storage_status={"sync_required": drift},
        integrity_status={"pairwise_ok": not drift},
        replay_alignment={"drift": drift},
        lineage_snapshot={"common_ancestor": "stub"},
        offline_constraints=["Reconciliação pode exigir online"],
    )
