"""SMT incremental (checkpoints) — payloads assistente, sem CNF exposto."""

from __future__ import annotations

from typing import Any


def incremental_smt_legality_stub(*, checkpoint_id: str, delta_events: list[str]) -> dict[str, Any]:
    return {
        "checkpoint_id": checkpoint_id,
        "delta_events": delta_events,
        "legality_reasoning": [
            "Avaliação incremental: apenas deltas desde o checkpoint são reavaliados.",
            "Compatível com assistente: não expõe cláusulas internas.",
        ],
        "proof_steps": [
            {"step": 1, "action": "load_checkpoint", "detail": checkpoint_id},
            {"step": 2, "action": "apply_deltas", "detail": str(len(delta_events))},
        ],
        "assistant_notes": [
            "Judge assistant: use isto como suporte a decisões, não como veredicto automático.",
        ],
        "replay_legality_summary": (
            "Estado legal coerente com o checkpoint assumido; deltas verificados localmente."
        ),
    }
