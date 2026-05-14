"""Rotação de assinaturas de replay (stub v2)."""

from __future__ import annotations

from typing import Any

from app.mobile_runtime._judge_mobile_payload import judge_mobile_core_payload


def replay_signature_rotation_stub(kid: str) -> dict[str, Any]:
    return judge_mobile_core_payload(
        replay_summary={"kid": kid, "rotation": "scheduled"},
        sync_hints=["Suportar janela de overlap de chaves para zero-downtime."],
        deterministic_alignment={"rotation_id": f"rsr-{kid}"},
        mobile_constraints={"overlap_minutes": 15},
        offline_confidence=0.66,
        assistant_notes=["Rotação não invalida slices antigos assinados com KID anterior válido."],
        lineage_replay_slice="rsr-v2",
    )
