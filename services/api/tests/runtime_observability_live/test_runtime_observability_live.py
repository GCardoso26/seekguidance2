from app.observability.live_runtime import otel_live_runtime_v2_stub


def test_runtime_observability_live_stub() -> None:
    assert otel_live_runtime_v2_stub("api")["otel_live_runtime_v2"] is True
