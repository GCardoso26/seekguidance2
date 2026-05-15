"""Runtime incident detection."""

from __future__ import annotations

from app.observability.runtime_exporters import replay_runtime_incident_detection_stub


def test_incident_detection() -> None:
    p = replay_runtime_incident_detection_stub("obs-1")
    assert "replay_incident_summary" in p
