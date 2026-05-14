"""Orquestração de filas (prioridades, health, isolamento lógico)."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass(order=True)
class QueueSpec:
    priority: int
    name: str
    isolated: bool = False


DEFAULT_QUEUES: tuple[QueueSpec, ...] = (
    QueueSpec(100, "ingestion", isolated=True),
    QueueSpec(90, "replay", isolated=True),
    QueueSpec(80, "ontology_rebuild", isolated=False),
    QueueSpec(70, "graph_recompute", isolated=False),
    QueueSpec(60, "evaluation", isolated=False),
    QueueSpec(50, "drift_analysis", isolated=False),
)


def queue_starvation_hint(depths: dict[str, int], *, warn_below: int = 1) -> dict[str, Any]:
    starving = [q for q, d in depths.items() if d < warn_below]
    return {"starving": starving, "depths": depths}


def worker_heartbeat_ok(last_ts: float, now: float, *, max_age_s: float = 45.0) -> bool:
    return (now - last_ts) <= max_age_s
