"""Assinaturas HMAC para partilha de vereditos."""

from app.judge.share_signing import sign_share_id, verify_share_signature

SHARE_ID = "123e4567-e89b-12d3-a456-426614174000"
SECRET = "test-secret-wave2b"


def test_sign_and_verify() -> None:
    sig = sign_share_id(SHARE_ID, SECRET)
    assert sig
    assert verify_share_signature(SHARE_ID, sig, SECRET)


def test_invalid_signature_rejected() -> None:
    assert not verify_share_signature(SHARE_ID, "bad", SECRET)


def test_no_secret_skips_verification() -> None:
    assert verify_share_signature(SHARE_ID, None, None)
