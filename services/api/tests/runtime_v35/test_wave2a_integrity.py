"""Smoke Wave 2A — payloads com integrity_status."""


def test_semantic_cache_stats_integrity():
    from app.runtime_judge_semantic_cache.cache import cache_stats_snapshot

    s = cache_stats_snapshot()
    assert s["integrity_status"] == "ok"
