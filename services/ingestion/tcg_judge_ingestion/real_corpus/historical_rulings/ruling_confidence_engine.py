"""Motor de confiança para rulings ingeridos (assistant-grade, não legal)."""

from __future__ import annotations

from typing import Any


def ruling_confidence_engine(record: dict[str, Any]) -> dict[str, Any]:
    official = bool(record.get("official_source"))
    citations = int(record.get("citations") or 0)
    base = 0.82 if official else 0.48
    boost = min(0.12, 0.02 * citations)
    score = round(min(1.0, base + boost), 4)
    return {
        "score": score,
        "player_hint": "Fonte oficial" if official else "Verificar com documentação do jogo",
        "explainability": "Combinação de origem oficial e citações cruzadas.",
    }
