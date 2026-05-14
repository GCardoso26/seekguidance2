"""Confiança operacional agregada (sem alterar payloads reasoning)."""

from __future__ import annotations

from typing import Any


def operational_confidence_bundle(
    *,
    retrieval_conf: float,
    graph_conf: float,
    replay_conf: float,
    cross_tcg_penalty: float = 0.0,
) -> dict[str, Any]:
    base = 0.35 * retrieval_conf + 0.35 * graph_conf + 0.3 * replay_conf
    score = max(0.0, min(1.0, base - cross_tcg_penalty))
    return {
        "score": round(score, 4),
        "retrieval": retrieval_conf,
        "graph": graph_conf,
        "replay": replay_conf,
        "cross_tcg_penalty": cross_tcg_penalty,
    }
