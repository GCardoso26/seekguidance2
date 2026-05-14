"""Governança do runtime móvel (políticas operacionais) — stub."""

from __future__ import annotations

from typing import Any

from app.mobile_runtime._judge_mobile_payload import judge_mobile_core_payload


def mobile_runtime_governance_stub(policy_tier: str) -> dict[str, Any]:
    return judge_mobile_core_payload(
        replay_summary={"policy_tier": policy_tier, "explainability": "mandatory"},
        sync_hints=["Registrar decisões de degradação no dispositivo.", "Enviar métricas agregadas quando online."],
        deterministic_alignment={"policy_hash": f"gov-{policy_tier}"},
        mobile_constraints={"throttle_on_thermal": True},
        offline_confidence=0.68,
        assistant_notes=["Governança local complementa replay_governance_v2; não a substitui."],
        lineage_replay_slice="gov-mobile-v0",
    )
