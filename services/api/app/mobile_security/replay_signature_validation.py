"""Validação de assinatura de replay (stub)."""

from __future__ import annotations

from typing import Any

from app.mobile_runtime._judge_mobile_payload import judge_mobile_core_payload


def replay_signature_validation_stub(sig_ok: bool) -> dict[str, Any]:
    return judge_mobile_core_payload(
        replay_summary={"signature_ok": sig_ok},
        sync_hints=["Se falhar, marcar slice como não confiável para merge."],
        deterministic_alignment={"sig_check": "pass" if sig_ok else "fail"},
        mobile_constraints={"verify_cpu_ms_budget": 8},
        offline_confidence=0.81 if sig_ok else 0.2,
        assistant_notes=["Integridade replay-first; alinhado a replay governance."],
        lineage_replay_slice="sig-v0",
        extras={"tamper_detection": not sig_ok},
    )
