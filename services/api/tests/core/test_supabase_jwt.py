"""Testes Sprint 0 — JWT Supabase e require_judge_user."""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import time

import pytest
from app.api.judge_user import require_judge_user
from app.core.security.judge_user_context import verified_judge_user_id
from app.core.security.supabase_jwt import verify_supabase_access_token
from fastapi import HTTPException


def _make_token(secret: str, sub: str, *, exp: int | None = None) -> str:
    header = base64.urlsafe_b64encode(json.dumps({"alg": "HS256", "typ": "JWT"}).encode()).rstrip(b"=").decode()
    payload = {
        "sub": sub,
        "exp": exp if exp is not None else int(time.time()) + 3600,
    }
    payload_b64 = base64.urlsafe_b64encode(json.dumps(payload).encode()).rstrip(b"=").decode()
    signing_input = f"{header}.{payload_b64}".encode()
    sig = base64.urlsafe_b64encode(
        hmac.new(secret.encode(), signing_input, hashlib.sha256).digest()
    ).rstrip(b"=").decode()
    return f"{header}.{payload_b64}.{sig}"


def test_verify_supabase_access_token_valid():
    secret = "test-jwt-secret-32chars-minimum"
    token = _make_token(secret, "user-123")
    payload = verify_supabase_access_token(token, secret)
    assert payload is not None
    assert payload["sub"] == "user-123"


def test_verify_supabase_access_token_rejects_bad_signature():
    token = _make_token("secret-a-32chars-minimum-xxx", "user-123")
    assert verify_supabase_access_token(token, "secret-b-32chars-minimum-xxx") is None


def test_verify_supabase_access_token_rejects_expired():
    secret = "test-jwt-secret-32chars-minimum"
    token = _make_token(secret, "user-123", exp=int(time.time()) - 10)
    assert verify_supabase_access_token(token, secret) is None


def test_verify_es256_via_jwks(monkeypatch):
    import base64

    import jwt
    from cryptography.hazmat.primitives.asymmetric import ec
    from jwt import PyJWK

    def int_to_b64url(n: int, length: int) -> str:
        return base64.urlsafe_b64encode(n.to_bytes(length, "big")).rstrip(b"=").decode()

    private_key = ec.generate_private_key(ec.SECP256R1())
    numbers = private_key.public_key().public_numbers()
    kid = "test-es256-kid"
    jwk = {
        "kty": "EC",
        "crv": "P-256",
        "kid": kid,
        "alg": "ES256",
        "x": int_to_b64url(numbers.x, 32),
        "y": int_to_b64url(numbers.y, 32),
    }

    class FakeJWKClient:
        def get_signing_key_from_jwt(self, token: str) -> PyJWK:
            return PyJWK.from_dict(jwk)

    monkeypatch.setattr(
        "app.core.security.supabase_jwt._jwks_client",
        lambda _url: FakeJWKClient(),
    )

    token = jwt.encode(
        {"sub": "user-es256", "exp": int(time.time()) + 3600},
        private_key,
        algorithm="ES256",
        headers={"kid": kid},
    )
    payload = verify_supabase_access_token(
        token,
        None,
        supabase_url="https://example.supabase.co",
    )
    assert payload is not None
    assert payload["sub"] == "user-es256"


def test_es256_without_supabase_url_falls_back_to_hs256_only():
    header = base64.urlsafe_b64encode(
        json.dumps({"alg": "ES256", "typ": "JWT", "kid": "x"}).encode(),
    ).rstrip(b"=").decode()
    payload = base64.urlsafe_b64encode(
        json.dumps({"sub": "u", "exp": int(time.time()) + 3600}).encode(),
    ).rstrip(b"=").decode()
    token = f"{header}.{payload}.fakesig"
    assert verify_supabase_access_token(token, "test-jwt-secret-32chars-minimum") is None


def test_require_judge_user_uses_verified_context():
    token = verified_judge_user_id.set("verified-user")
    try:
        assert require_judge_user("verified-user") == "verified-user"
        assert require_judge_user(None) == "verified-user"
    finally:
        verified_judge_user_id.reset(token)


def test_require_judge_user_rejects_mismatched_header():
    token = verified_judge_user_id.set("verified-user")
    try:
        with pytest.raises(HTTPException) as exc:
            require_judge_user("other-user")
        assert exc.value.status_code == 403
    finally:
        verified_judge_user_id.reset(token)


def test_require_judge_user_dev_fallback_without_enforcement(monkeypatch):
    verified_judge_user_id.set(None)
    monkeypatch.setenv("ENVIRONMENT", "development")
    monkeypatch.setenv("JUDGE_SUPABASE_JWT_ENFORCE", "false")
    from app.core.config import get_settings

    get_settings.cache_clear()
    try:
        assert require_judge_user("dev-user") == "dev-user"
    finally:
        get_settings.cache_clear()
