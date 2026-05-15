"""Imports aws_runtime."""

from __future__ import annotations

from app.runtime.aws_runtime import aws_runtime_config_stub, aws_runtime_health_stub


def test_aws_runtime_stubs() -> None:
    h = aws_runtime_health_stub("s1")
    assert h["runtime_confidence"] > 0
    assert "operational_hints" in h
    c = aws_runtime_config_stub("s1")
    assert c["deployment_constraints"]["boto3_required"] is False
