"""Attestation de replay (stub v2)."""

from __future__ import annotations

from typing import Any

from app.mobile_runtime._judge_mobile_payload import judge_mobile_core_payload


def replay_attestation_stub(replay_id: str) -> dict[str, Any]:
    return judge_mobile_core_payload(
        replay_summary={"replay_id": replay_id, "attested": True},
        sync_hints=["Verificar cadeia de assinaturas antes de merge."],
        deterministic_alignment={"attest_token": f"ra-{replay_id}"},
        mobile_constraints={"verify_budget_ms": 15},
        offline_confidence=0.77,
        assistant_notes=["Attestation explicável: lista de checks, não só boolean."],
        lineage_replay_slice="ra-v2",
    )
