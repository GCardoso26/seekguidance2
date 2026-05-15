"""Alinhamento de métricas e spans."""

from __future__ import annotations

from app.observability.runtime_exporters import otel_span_registry, replay_metric_registry


def test_registries_prefix() -> None:
    m = replay_metric_registry()
    assert any(v.startswith("tcg_judge_") for v in m.values())
    s = otel_span_registry()
    assert s["replay_validate"].startswith("tcg_judge.")
