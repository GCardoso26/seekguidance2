"""Prefetch de dataset compacto (stub)."""

from __future__ import annotations

from typing import Any

from app.mobile_runtime._judge_mobile_payload import judge_mobile_core_payload


def mobile_dataset_prefetch_stub(dataset_id: str) -> dict[str, Any]:
    return judge_mobile_core_payload(
        replay_summary={"dataset_id": dataset_id, "prefetch_rows": 50},
        sync_hints=["Checksum incremental antes de aplicar prefetch."],
        deterministic_alignment={"token": f"mdp-{dataset_id}"},
        mobile_constraints={"wifi_only": False},
        offline_confidence=0.57,
        assistant_notes=["Prefetch de dataset não substitui validação judge-grade completa."],
        lineage_replay_slice="mdpf",
    )
