"""Testes app.runtime.runtime_real_persistence.engine."""
from app.runtime.runtime_real_persistence.engine import runtime_real_persistence_engine_v1


def test_engine_ok(monkeypatch) -> None:
    monkeypatch.setenv("RUNTIME_AUTH_SECRET", "test-secret")
    r = runtime_real_persistence_engine_v1("test-scope", action="health")
    assert r["integrity_status"] in ("ok", "degraded")
    assert r["runtime_confidence"] == 0.94
