from __future__ import annotations

import pytest
from app.core.config import Settings
from app.games.normalization.ontology_enrichment.inheritance import inheritance_edges
from app.games.normalization.semantic_taxonomy.tags import tag_known
from app.observability.slo import evaluate_latency_slo, evaluate_replay_slo
from app.observability.telemetry_bridge import configure_tracing


def test_production_settings_defaults() -> None:
    s = Settings(
        database_url="postgresql+asyncpg://u:p@localhost/db",
        redis_url="redis://localhost/0",
    )
    assert s.api_rate_limit_requests_per_minute == 60
    assert s.ingestion_default_host_rps == 1.0
    assert s.slo_retrieval_p95_ms_target > 0


def test_slo_helpers() -> None:
    assert evaluate_latency_slo(p95_ms=100.0, target_ms=800.0) is True
    assert evaluate_replay_slo(determinism_score=0.99, min_score=0.95) is True


def test_otel_bridge_disabled() -> None:
    assert configure_tracing(enabled=False, endpoint=None)["otel"] == "disabled"


def test_ontology_inheritance_mtg() -> None:
    edges = inheritance_edges("mtg")
    assert any(e[0] == "triggered_ability" for e in edges)


def test_semantic_tag_known() -> None:
    assert tag_known("ordered_resolution_window") is True


@pytest.mark.asyncio
async def test_host_throttle_acquire() -> None:
    from tcg_judge_ingestion.crawler.adaptive_fetch.throttle import HostThrottle

    t = HostThrottle(rps=50.0)
    await t.acquire()
