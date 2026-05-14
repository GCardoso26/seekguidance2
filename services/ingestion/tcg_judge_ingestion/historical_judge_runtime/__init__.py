"""Runtime histórico de decisões de juiz (metadados)."""

from __future__ import annotations

from typing import Any


def historical_judge_runtime_stub(case_id: str) -> dict[str, Any]:
    return {
        "case_id": case_id,
        "deterministic_replay_lineage": True,
        "confidence_scoring": {"judge": 0.7, "replay": 0.65},
        "assistant_notes": ["Arquivo assistente; não substitui fonte oficial."],
    }
