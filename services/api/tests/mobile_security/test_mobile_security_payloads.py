"""Segurança móvel — integridade e confiança."""

from __future__ import annotations

from app.mobile_security import replay_signature_validation_stub, tamper_detection_stub


def test_replay_signature() -> None:
    assert replay_signature_validation_stub(True)["replay_summary"]["signature_ok"] is True


def test_tamper_detection() -> None:
    out = tamper_detection_stub(True)
    assert out["offline_confidence"] < 0.5
