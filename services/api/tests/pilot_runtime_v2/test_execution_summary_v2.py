"""Pilot runtime v2."""

from __future__ import annotations

from app.runtime.pilot_runtime import pilot_runtime_execution_summary_v2_stub


def test_pilot_execution_summary_v2() -> None:
    p = pilot_runtime_execution_summary_v2_stub("pilot")
    assert p["pilot_readiness_score"] > 0
