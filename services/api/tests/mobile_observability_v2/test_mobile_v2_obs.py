from app.observability.live_runtime import mobile_runtime_health_v2_stub, mobile_runtime_tracing_stub


def test_mobile_observability_v2() -> None:
    assert mobile_runtime_tracing_stub("t1")["trace_id"] == "t1"
    assert mobile_runtime_health_v2_stub(True)["healthy"] is True
