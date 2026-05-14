"""Certificados de legalidade multiplayer (APNAP / ordem)."""

from __future__ import annotations

from typing import Any


def multiplayer_legality_certificate_stub(players: int, windows: int) -> dict[str, Any]:
    return {
        "players": players,
        "windows": windows,
        "legality_reasoning": [
            "Ordem não simultânea modelada como fila de janelas por prioridade relativa (stub).",
        ],
        "proof_steps": [{"step": 1, "action": "enqueue_windows", "count": windows}],
        "assistant_notes": ["APNAP e variantes são explicadas ao juiz, não substituídas por motor jurídico."],
        "replay_legality_summary": "Cenário multiplayer consistente com prioridades declaradas no replay sintético.",
    }
