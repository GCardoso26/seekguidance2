"""Multiplayer bounded (formal v6)."""

from __future__ import annotations

from typing import Any

from app.verification.formal_solver_v6._payloads import _v6_payload


def bounded_multiplayer_solver_payload(players: int, cap: int) -> dict[str, Any]:
    ok = players <= cap
    return _v6_payload(
        legality_reasoning=["Busca multiplayer truncada ao orçamento."],
        proof_steps=[{"step": 1, "action": "bound_players", "players": players}],
        assistant_notes=["APNAP MTG; sem equivalência YGO/FAB."],
        replay_legality_summary="Cenário multiplayer certificado no cap." if ok else "Fora do cap: revisão.",
        solver_confidence=0.7 if ok else 0.4,
        legality_certificates=["mp_stub"] if ok else [],
    )
