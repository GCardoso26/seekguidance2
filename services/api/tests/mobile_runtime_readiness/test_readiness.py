"""Readiness móvel."""

from __future__ import annotations

from app.mobile_runtime.mobile_runtime_readiness import mobile_runtime_readiness_stub


def test_mobile_readiness() -> None:
    r = mobile_runtime_readiness_stub("d1")
    assert r["readiness"]["device_id"] == "d1"
