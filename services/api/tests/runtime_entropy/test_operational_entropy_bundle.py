from app.observability.live_runtime import runtime_entropy_live_stub
from app.observability.runtime_exporters import branch_entropy_exporter_stub


def test_entropy_operational_stubs() -> None:
    assert runtime_entropy_live_stub("s")["layer"] == "runtime_entropy_live"
    assert "prometheus_prefix" in branch_entropy_exporter_stub("x")
