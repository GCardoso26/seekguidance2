"""Escalonamento adaptativo de workers (recomendação conservadora)."""

from __future__ import annotations


def adaptive_worker_replicas(queue_depth: int, *, per_worker_capacity: int = 10) -> int:
    if per_worker_capacity <= 0:
        return 1
    need = (queue_depth + per_worker_capacity - 1) // per_worker_capacity
    return max(1, min(32, need))
