"""Provas de legalidade ancoradas em replay."""

from __future__ import annotations

from typing import Any


def replay_legality_proofs_stub(replay_id: str, ok: bool) -> dict[str, Any]:
    return {
        "replay_id": replay_id,
        "ok": ok,
        "legality_reasoning": ["Prova referencia replay determinístico e snapshot de corpus."],
        "proof_steps": [{"step": 1, "action": "bind_replay", "id": replay_id}],
        "assistant_notes": ["Lineage temporal deve cobrir o snapshot usado."],
        "replay_legality_summary": (
            "Replay suporta certificado assistente." if ok else "Replay contestado pelo stub."
        ),
    }
