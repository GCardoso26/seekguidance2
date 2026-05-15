"""Hardening drift operacional v7."""

from __future__ import annotations

from app.games.hardening_v7 import replay_drift_operational_diagnostic_v7_stub


def test_operational_drift_diag() -> None:
    d = replay_drift_operational_diagnostic_v7_stub("scope")
    assert d["topic"] == "replay_drift"
