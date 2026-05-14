"""Validação SEGOC / ordem de efeitos Yu-Gi-Oh! (assistente)."""

from __future__ import annotations

from typing import Any


def segoc_validation_stub(mandatory_first: bool, chains: int) -> dict[str, Any]:
    return {
        "mandatory_first": mandatory_first,
        "chains": chains,
        "legality_reasoning": [
            "SEGOC tratado como constraints de ordenação explícitas, sem colapsar para outro TCG.",
        ],
        "proof_steps": [{"step": 1, "action": "order_mandatory", "ok": mandatory_first}],
        "assistant_notes": ["Yu-Gi-Oh! mantém semântica própria; comparações cross-TCG são apenas análogas fracas."],
        "replay_legality_summary": "Ordenação proposta respeita mandatory-first quando exigido pelo cenário.",
    }
