"""Testes de assinatura de partilha com grace period."""

from app.judge.share_signing import sign_share_id, verify_share_signature


def test_verify_current_secret() -> None:
    sid = "550e8400-e29b-41d4-a716-446655440000"
    secret = "test-secret-current"
    sig = sign_share_id(sid, secret)
    assert sig
    assert verify_share_signature(sid, sig, secret)


def test_verify_previous_secret_grace() -> None:
    sid = "550e8400-e29b-41d4-a716-446655440001"
    old = "test-secret-old"
    new = "test-secret-new"
    sig = sign_share_id(sid, old)
    assert verify_share_signature(sid, sig, new, previous_secret=old)


def test_tampered_signature_rejected() -> None:
    sid = "550e8400-e29b-41d4-a716-446655440002"
    sig = sign_share_id(sid, "secret-a")
    assert sig
    bad = sig[:-1] + ("0" if sig[-1] != "0" else "1")
    assert not verify_share_signature(sid, bad, "secret-a")
