"""Estabilidade do solver em runtime."""

from __future__ import annotations

from typing import Any

from app.verification.formal_solver_v6._payloads import _v6_payload


def solver_stability_runtime_payload(variance: float) -> dict[str, Any]:
    return _v6_payload(
        legality_reasoning=["Variância de resultados dentro do orçamento."],
        proof_steps=[{"step": 1, "variance": variance}],
        assistant_notes=["Instabilidade aciona timeout governance."],
        replay_legality_summary="Estável para replays determinísticos." if variance < 0.1 else "Investigar.",
        solver_confidence=max(0.0, 1.0 - variance),
    )
