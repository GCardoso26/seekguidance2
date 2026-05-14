"""Observabilidade em modo offline (stub)."""

from __future__ import annotations

from typing import Any


def mobile_offline_observability_stub(queue_depth: int) -> dict[str, Any]:
    return {
        "queue_depth": queue_depth,
        "replay_summary": {"deferred_uploads": queue_depth},
        "assistant_notes": ["Métricas armazenadas em ring buffer até sync."],
        "sync_hints": ["Marcar causa quando fila > limiar."],
        "deterministic_alignment": {"drift_watchdog": "armed"},
        "mobile_constraints": {"max_queue": 200},
        "offline_confidence": 0.46,
        "lineage_replay_awareness": {"slice": "moo-v0"},
    }
