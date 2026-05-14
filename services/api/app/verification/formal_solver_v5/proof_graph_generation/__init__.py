"""Geração de grafo de prova (explicável)."""

from __future__ import annotations

from typing import Any


def proof_graph_generation_payload(nodes: int) -> dict[str, Any]:
    return {
        "nodes": nodes,
        "legality_reasoning": ["Grafo resumido para auditoria humana."],
        "proof_steps": [{"step": 1, "action": "materialize_graph", "nodes": nodes}],
        "assistant_notes": ["Sem export de nós SAT brutos."],
        "solver_confidence": 0.74,
    }
