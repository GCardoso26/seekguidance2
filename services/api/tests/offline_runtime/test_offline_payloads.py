"""Payloads offline-first com campos explícitos."""

from __future__ import annotations

from app.offline_runtime import offline_governance_stub, offline_reasoning_stub


def test_offline_reasoning_payload() -> None:
    out = offline_reasoning_stub("c1")
    assert "offline_limitations" in out and out["offline_confidence"] <= 1.0


def test_offline_governance() -> None:
    out = offline_governance_stub("tournament")
    assert out["mobile_constraints"]["strict_mode"] is True
