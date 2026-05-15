"""Registry in-memory de nós federation (stdlib)."""

from __future__ import annotations

import time
from typing import Any

_NODES: dict[str, dict[str, Any]] = {}


def register_federation_node(node_id: str, *, health: float = 1.0) -> dict[str, Any]:
    _NODES[node_id] = {"node_id": node_id, "health": health, "registered_at": time.time()}
    return dict(_NODES[node_id])


def federation_health_summary() -> dict[str, Any]:
    if not _NODES:
        return {"node_count": 0, "health_score": 0.0}
    scores = [n["health"] for n in _NODES.values()]
    return {
        "node_count": len(_NODES),
        "health_score": round(sum(scores) / len(scores), 4),
    }
