from app.runtime.runtime_real_metrics.collector import prometheus_text, record, snapshot


def test_metrics_record() -> None:
    record("test.metric", 1.0)
    s = snapshot()
    assert "aggregates" in s
    assert "runtime_test_metric_total" in prometheus_text() or "# TYPE" in prometheus_text()
