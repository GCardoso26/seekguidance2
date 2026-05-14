"""Predição leve de carga do runtime móvel (stub)."""

from __future__ import annotations

from typing import Any

from app.mobile_runtime._judge_mobile_payload import judge_mobile_core_payload


def mobile_runtime_prediction_stub(signal: float) -> dict[str, Any]:
    return judge_mobile_core_payload(
        replay_summary={"signal": signal, "forecast": "stable"},
        sync_hints=["Ajustar prefetch com base no forecast."],
        deterministic_alignment={"token": "mrp"},
        mobile_constraints={"lookahead_ms": 80},
        offline_confidence=0.52,
        assistant_notes=["Predição não altera eventos persistidos; apenas orçamento."],
        lineage_replay_slice="mrp",
    )
