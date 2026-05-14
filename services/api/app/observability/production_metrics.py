"""Métricas adicionais de produção (retrieval, reasoning, drift)."""

from __future__ import annotations

from typing import Any

_PROD: dict[str, float] = {}


def observe(name: str, value: float) -> None:
    _PROD[name] = float(value)


def production_metrics_snapshot() -> dict[str, Any]:
    """Chaves alinhadas a dashboards Prometheus/Grafana (valores agregados in-process)."""
    return {
        "retrieval_quality": _PROD.get("retrieval_quality", 0.0),
        "rerank_quality": _PROD.get("rerank_quality", 0.0),
        "reasoning_depth": _PROD.get("reasoning_depth", 0.0),
        "constraint_failures": _PROD.get("constraint_failures", 0.0),
        "semantic_drift": _PROD.get("semantic_drift", 0.0),
        "hallucination_rate": _PROD.get("hallucination_rate", 0.0),
        "replay_consistency": _PROD.get("replay_consistency", 0.0),
        "deterministic_stability": _PROD.get("deterministic_stability", 0.0),
        "note": "wire_to_prometheus_exporter",
    }
