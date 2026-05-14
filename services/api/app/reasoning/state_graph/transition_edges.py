"""Arestas de transição para o grafo de estados."""

from __future__ import annotations

from typing import Any


def transition_edge(from_id: str, to_id: str, label: str) -> dict[str, Any]:
    return {"from": from_id, "to": to_id, "label": label, "edge_type": "symbolic_transition"}
