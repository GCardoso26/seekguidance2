"""Infra de operações (presença e conteúdo mínimo)."""

from __future__ import annotations

from pathlib import Path

import pytest

REPO = Path(__file__).resolve().parents[4]


@pytest.mark.parametrize(
    "rel",
    [
        "infra/runtime_operations/README.md",
        "infra/disaster_recovery_v2/README.md",
        "infra/worker_scaling/README.md",
        "infra/cache_runtime/README.md",
        "infra/replay_storage/README.md",
        "infra/semantic_storage/README.md",
        "infra/observability/otel_collector_live/collector.fragment.yaml",
        "infra/observability/prometheus_live/recording_rules.fragment.yml",
        "infra/runtime_operations/runtime_governance/README.md",
        "infra/runtime_operations/distributed_runtime_health/README.md",
        "infra/runtime_operations/persistent_dlq_runtime/README.md",
        "infra/runtime_operations/replay_archive_storage/README.md",
        "infra/disaster_recovery_v2/semantic_snapshot_storage/README.md",
        "infra/disaster_recovery_v2/runtime_recovery_playbooks/README.md",
        "infra/worker_scaling/autoscaling_profiles/README.md",
        "infra/worker_scaling/runtime_slo_tracking/README.md",
        "infra/observability/grafana_runtime/judge_runtime_overview.json",
        "infra/observability/grafana_runtime/replay_stability_board.json",
        "infra/observability/otel_live/collector.snippet.yaml",
        "infra/observability/prometheus_runtime/scrape.snippet.yml",
        "infra/observability/alerting/runtime_replay.rules.yml",
    ],
)
def test_ops_doc_exists(rel: str) -> None:
    p = REPO / rel
    assert p.is_file()
    assert len(p.read_text(encoding="utf-8").strip()) > 20
