"""Reasoning leve no dispositivo (hints; não substitui reasoning_v1…v11)."""

from __future__ import annotations

from typing import Any

from app.mobile_runtime._judge_mobile_payload import judge_mobile_core_payload


def lightweight_reasoning_runtime_stub(case_id: str) -> dict[str, Any]:
    return judge_mobile_core_payload(
        replay_summary={"case_id": case_id, "depth_cap": 6, "mode": "local-hints"},
        sync_hints=["Sincronizar com núcleo antes de ruling final.", "Delta semântico preferível a full ontology."],
        deterministic_alignment={"stable_token": f"lr-{case_id}", "replay_anchor": "slice-local"},
        mobile_constraints={"battery_aware": True, "mem_soft_cap_mb": 512},
        offline_confidence=0.62,
        assistant_notes=[
            "Apenas legibilidade e hints; juiz humano decide.",
            "Pipelines V1–V11 permanecem no servidor.",
        ],
        lineage_replay_slice=f"lr-{case_id}",
    )
