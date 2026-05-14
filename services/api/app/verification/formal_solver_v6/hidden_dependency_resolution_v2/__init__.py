"""Dependências ocultas v2."""

from __future__ import annotations

from typing import Any

from app.verification.formal_solver_v6._payloads import _v6_payload


def hidden_dependency_resolution_v2_payload(nodes: list[str]) -> dict[str, Any]:
    return _v6_payload(
        legality_reasoning=["Grafo parcial de dependências para FAB/YGO."],
        proof_steps=[{"step": 1, "nodes": len(nodes)}],
        assistant_notes=["Hidden dependencies nunca colapsam entre TCGs."],
        replay_legality_summary="Ordem sugerida auditável no stub.",
        solver_confidence=0.71,
    )
