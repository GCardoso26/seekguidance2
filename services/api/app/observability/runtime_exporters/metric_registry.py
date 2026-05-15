"""Registo canónico de métricas (namespaces alinhados)."""

from __future__ import annotations

REPLAY_PREFIX = "tcg_judge_replay_"
RUNTIME_PREFIX = "tcg_judge_runtime_"
MOBILE_PREFIX = "tcg_judge_mobile_"
LINEAGE_PREFIX = "tcg_judge_lineage_"


def replay_metric_registry() -> dict[str, str]:
    return {
        "replay_entropy": f"{REPLAY_PREFIX}entropy_gauge",
        "replay_sync_conflicts": f"{REPLAY_PREFIX}sync_conflicts_total",
        "replay_lineage_depth": f"{LINEAGE_PREFIX}depth_gauge",
        "runtime_health": f"{RUNTIME_PREFIX}health_gauge",
        "mobile_sync_queue": f"{MOBILE_PREFIX}sync_queue_depth",
    }


def metric_namespace_governance_stub() -> dict[str, list[str]]:
    return {
        "assistant_notes": [
            "metric_registry: prefixos estáveis; labels agregados sem PII.",
        ],
        "prefixes": [REPLAY_PREFIX, RUNTIME_PREFIX, MOBILE_PREFIX, LINEAGE_PREFIX],
    }
