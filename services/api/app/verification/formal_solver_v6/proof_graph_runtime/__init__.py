"""Grafo de prova em runtime."""

from __future__ import annotations

from typing import Any

from app.verification.formal_solver_v6._payloads import _v6_payload


def proof_graph_runtime_payload(nodes: int) -> dict[str, Any]:
    return _v6_payload(
        legality_reasoning=["Grafo humanamente legível."],
        proof_steps=[{"step": 1, "nodes": nodes}],
        assistant_notes=["Sem export de nós SAT brutos."],
        replay_legality_summary="Prova associável a snapshot de replay.",
        solver_confidence=0.72,
    )
