"""Discrepâncias humanas vs assistente."""

from __future__ import annotations

from typing import Any


def human_disagreement_analysis_stub(disagreements: int, samples: int) -> dict[str, Any]:
    rate = disagreements / samples if samples else 0.0
    return {"rate": rate, "assistant_notes": ["Alimenta judge-grade calibration sem substituir juiz."]}
