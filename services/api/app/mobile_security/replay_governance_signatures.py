"""Assinaturas de governança de replay (v3 stub)."""

from __future__ import annotations

from typing import Any

from app.mobile_runtime._judge_mobile_payload import judge_mobile_core_payload


def replay_governance_signatures_stub(policy: str) -> dict[str, Any]:
    return judge_mobile_core_payload(
        replay_summary={"policy": policy, "signed": True},
        sync_hints=["Rotação de chaves cooperante com replay_signature_rotation."],
        deterministic_alignment={"kid": f"rgs-{policy}"},
        mobile_constraints={"strict": policy == "tournament"},
        offline_confidence=0.64,
        assistant_notes=["Assinaturas alinhadas a replay_governance_v2."],
        lineage_replay_slice="rgs-v3",
    )
