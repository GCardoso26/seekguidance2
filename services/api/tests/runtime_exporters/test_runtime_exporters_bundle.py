from app.observability.runtime_exporters import prometheus_runtime_exporter_stub


def test_runtime_exporter_stub() -> None:
    out = prometheus_runtime_exporter_stub("api")
    assert out["otel_scope"].startswith("tcg_judge.")
