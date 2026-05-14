"""Governança de segurança offline (políticas de sync) — stub."""

from __future__ import annotations

from typing import Any

from app.mobile_runtime._judge_mobile_payload import judge_mobile_core_payload


def offline_governance_security_stub(strict: bool) -> dict[str, Any]:
    return judge_mobile_core_payload(
        replay_summary={"strict": strict, "policy": "mobile-security-v0"},
        sync_hints=["Em strict, bloquear upload sem assinatura válida."],
        deterministic_alignment={"policy_hash": "ogs-v0"},
        mobile_constraints={"strict_mode": strict},
        offline_confidence=0.55,
        assistant_notes=["Camada segurança complementa offline_runtime/offline_governance_stub."],
        lineage_replay_slice="sec-gov-v0",
        extras={"operational_safety": "judge_confirmation_for_rulings"},
    )
