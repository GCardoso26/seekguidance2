from app.runtime.production_runtime import aws_runtime_orchestration_stub


def test_aws_runtime_orchestration_stub() -> None:
    out = aws_runtime_orchestration_stub()
    assert "aws_platform_enabled" in out
