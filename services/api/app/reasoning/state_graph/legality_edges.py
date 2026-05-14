"""Arestas de ilegalidade / bloqueio."""

from __future__ import annotations

from typing import Any


def legality_edge(state_id: str, reason: str) -> dict[str, Any]:
    return {"state": state_id, "reason": reason, "edge_type": "illegality_marker"}
