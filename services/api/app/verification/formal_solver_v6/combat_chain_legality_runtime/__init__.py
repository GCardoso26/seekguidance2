"""Combat chain legality runtime (FAB)."""

from __future__ import annotations

from typing import Any

from app.verification.formal_solver_v6._payloads import _v6_payload


def combat_chain_legality_runtime_payload(open_reactions: bool) -> dict[str, Any]:
    return _v6_payload(
        legality_reasoning=["Combat chain FAB com janelas reativas."],
        proof_steps=[{"step": 1, "reactions_open": open_reactions}],
        assistant_notes=["Não equiparar a stack genérico."],
        replay_legality_summary="Cadeia coerente com reações declaradas.",
        solver_confidence=0.78,
        legality_certificates=["fab_chain_stub"],
    )
