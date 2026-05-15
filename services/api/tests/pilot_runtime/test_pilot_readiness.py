"""Pilot runtime readiness."""

from __future__ import annotations

from app.runtime.pilot_runtime import pilot_runtime_readiness_stub


def test_pilot_readiness() -> None:
    p = pilot_runtime_readiness_stub("pilot-1")
    assert p["pilot_readiness_score"] > 0
