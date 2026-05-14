"""Sessões incrementais do solver."""

from __future__ import annotations

from typing import Any

from app.verification.formal_solver_v6._payloads import _v6_payload


def incremental_solver_sessions_payload(session_id: str) -> dict[str, Any]:
    return _v6_payload(
        legality_reasoning=["Sessão incremental reutiliza estado verificável."],
        proof_steps=[{"step": 1, "action": "resume_session", "session_id": session_id}],
        assistant_notes=["Sessões bounded para produção distribuída."],
        replay_legality_summary="Checkpoint de sessão alinhado ao replay.",
        solver_confidence=0.77,
    )
