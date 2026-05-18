"""Testes app.runtime.runtime_real_observability_v2.engine."""
from app.runtime.runtime_real_observability_v2.engine import runtime_real_observability_engine_v2


def test_engine_ok(monkeypatch) -> None:
    monkeypatch.setenv("RUNTIME_AUTH_SECRET", "test-secret")
    r = runtime_real_observability_engine_v2("test-scope")
    assert r["integrity_status"] in ("ok", "degraded")
    assert r["runtime_confidence"] == 0.94
