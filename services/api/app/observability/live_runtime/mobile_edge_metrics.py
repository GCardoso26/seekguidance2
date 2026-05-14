"""Métricas edge móvel (stub)."""

from __future__ import annotations

from typing import Any


def mobile_edge_metrics_stub(edge_session: str) -> dict[str, Any]:
    return {
        "edge_session": edge_session,
        "assistant_notes": ["Edge vs cloud: latências separadas por caminho."],
        "replay_summary": {"local_ticks": 40},
        "deterministic_alignment": {"token": f"mem-{edge_session}"},
        "lineage_replay_awareness": {"slice": "mem-v2"},
    }
