"""Integridade HMAC de replay."""

from __future__ import annotations

from app.security.replay_integrity import sign_replay_payload, verify_replay_payload


def test_sign_verify_roundtrip() -> None:
    p = {"events": [{"t": 1}], "seed": 42}
    sig = sign_replay_payload(p, "secret")
    assert verify_replay_payload(p, "secret", sig)
    assert not verify_replay_payload({**p, "seed": 43}, "secret", sig)
