"""Validação de sessão offline (stub)."""

from __future__ import annotations

from typing import Any

from app.mobile_runtime._judge_mobile_payload import judge_mobile_core_payload


def offline_session_validation_stub(expired: bool) -> dict[str, Any]:
    return judge_mobile_core_payload(
        replay_summary={"expired": expired, "grace_ticks": 0 if expired else 12},
        sync_hints=["Se expirado, exigir refresh antes de upload de ruling."],
        deterministic_alignment={"session_state": "invalid" if expired else "valid"},
        mobile_constraints={"offline_grace": not expired},
        offline_confidence=0.42 if expired else 0.78,
        assistant_notes=["Tokens em cache seguro; sem logging de segredos."],
        lineage_replay_slice="sess-v0",
        extras={"replay_signature_required": True},
    )
