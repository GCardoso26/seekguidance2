from app.runtime.runtime_real_observability.engine import runtime_real_observability_engine_v1


def test_observability() -> None:
    r = runtime_real_observability_engine_v1("o", action="metric", metric="requests", value=1.0)
    assert r["integrity_status"] == "ok"
    assert r["structured_logging"] is True
