"""Attestation do runtime offline (stub v2)."""

from __future__ import annotations

from typing import Any

from app.mobile_runtime._judge_mobile_payload import judge_mobile_core_payload


def offline_runtime_attestation_stub(level: str) -> dict[str, Any]:
    return judge_mobile_core_payload(
        replay_summary={"level": level, "attested_components": ["journal", "queue"]},
        sync_hints=["Re-attest após recovery ou migração de schema."],
        deterministic_alignment={"token": f"ora-{level}"},
        mobile_constraints={"strict": level == "tournament"},
        offline_confidence=0.58,
        assistant_notes=["Governança offline reforçada sem bloquear operação do juiz."],
        lineage_replay_slice="ora-v2",
    )
