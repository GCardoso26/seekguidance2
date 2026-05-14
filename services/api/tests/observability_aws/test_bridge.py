from app.observability.live_runtime import aws_observability_bridge_stub


def test_observability_bridge() -> None:
    out = aws_observability_bridge_stub()
    assert "aws_xray_enabled" in out
