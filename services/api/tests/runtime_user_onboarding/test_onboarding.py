"""Testes app.runtime.runtime_user_onboarding.engine."""
from app.runtime.runtime_user_onboarding.engine import runtime_user_onboarding_engine_v1


def test_engine_ok(monkeypatch) -> None:
    monkeypatch.setenv("RUNTIME_AUTH_SECRET", "test-secret")
    r = runtime_user_onboarding_engine_v1("test-scope")
    assert r["integrity_status"] in ("ok", "degraded")
    assert r["runtime_confidence"] == 0.94
