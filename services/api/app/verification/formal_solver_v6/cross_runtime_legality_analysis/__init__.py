"""Análise cross-runtime de legalidade."""

from __future__ import annotations

from typing import Any

from app.verification.formal_solver_v6._payloads import _v6_payload


def cross_runtime_legality_analysis_payload(flags: dict[str, bool]) -> dict[str, Any]:
    aligned = all(flags.values()) if flags else True
    return _v6_payload(
        legality_reasoning=["Comparação de artefactos solver/replay/registry."],
        proof_steps=[{"step": 1, "flags": list(flags.keys())}],
        assistant_notes=["Cross-runtime sem equivalência forte cross-TCG."],
        replay_legality_summary="Análise concluída sem surpresas." if aligned else "Pontos de revisão listados.",
        solver_confidence=0.83 if aligned else 0.58,
    )
