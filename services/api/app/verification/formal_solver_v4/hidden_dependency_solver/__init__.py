"""Dependências ocultas / ordem implícita (bounded, explicável)."""

from __future__ import annotations

from typing import Any


def hidden_dependency_resolution_stub(nodes: list[str]) -> dict[str, Any]:
    return {
        "nodes": nodes,
        "legality_reasoning": [
            "Grafo parcial de dependências materializado; arestas faltantes são listadas como incertezas.",
        ],
        "proof_steps": [{"step": 1, "action": "topo_sort_attempt", "nodes": len(nodes)}],
        "assistant_notes": ["Incompatibilidades semânticas são diagnosticadas, não corrigidas automaticamente."],
        "replay_legality_summary": "Ordem sugerida compatível com dependências explícitas conhecidas.",
    }
