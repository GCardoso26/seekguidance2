"""Identidade cross-device (stub v2)."""

from __future__ import annotations

from typing import Any

from app.mobile_runtime._judge_mobile_payload import judge_mobile_core_payload


def cross_device_identity_stub(cluster_id: str) -> dict[str, Any]:
    return judge_mobile_core_payload(
        replay_summary={"cluster_id": cluster_id, "binding": "pairwise-salt"},
        sync_hints=["Rotacionar chaves após evento de segurança."],
        deterministic_alignment={"token": f"cdi-{cluster_id}"},
        mobile_constraints={"max_peers": 8},
        offline_confidence=0.6,
        assistant_notes=["Identidade operacional; não substitui credenciais de torneio oficiais."],
        lineage_replay_slice="cdi-v2",
        extras={"attestation_level": "stub-v2"},
    )
