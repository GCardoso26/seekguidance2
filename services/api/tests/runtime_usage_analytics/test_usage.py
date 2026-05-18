"""Testes app.runtime.runtime_usage_analytics.engine."""
from app.runtime.runtime_usage_analytics.engine import runtime_usage_analytics_engine_v1


def test_engine_ok(monkeypatch) -> None:
    monkeypatch.setenv("RUNTIME_AUTH_SECRET", "test-secret")
    r = runtime_usage_analytics_engine_v1("test-scope")
    assert r["integrity_status"] in ("ok", "degraded")
    assert r["runtime_confidence"] == 0.94
