"""Testes do módulo de segurança."""

from __future__ import annotations

import os
from pathlib import Path

import pytest
from app.core.config import get_settings
from app.core.security import crypto
from app.core.security.headers import apply_security_headers
from app.core.security.redaction import mask_mapping, mask_string, sanitize_exception_message
from app.core.security.token_revocation import is_revoked, revoke_jti
from app.runtime.runtime_real_auth.engine import runtime_real_auth_engine_v1


@pytest.fixture
def auth_db(tmp_path: Path) -> str:
    return str(tmp_path / "auth.sqlite")


def test_mask_email_and_jwt() -> None:
    s = "user@example.com Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.sig"
    out = mask_string(s)
    assert "user@example.com" not in out
    assert "eyJ" not in out


def test_mask_mapping_redacts_keys() -> None:
    data = {"password": "secret123", "nested": {"access_token": "abc"}}
    masked = mask_mapping(data)
    assert masked["password"] == "[REDACTED]"
    assert masked["nested"]["access_token"] == "[REDACTED]"


def test_bcrypt_password_roundtrip() -> None:
    h = crypto.hash_password("test-pass")
    assert crypto.verify_password("test-pass", h)
    assert not crypto.verify_password("wrong", h)


def test_api_key_salt_roundtrip() -> None:
    h = crypto.hash_api_key("my-key")
    assert crypto.verify_api_key("my-key", h)
    assert not crypto.verify_api_key("other", h)


def test_aes_gcm_roundtrip() -> None:
    import base64

    key = base64.urlsafe_b64encode(os.urandom(32)).decode().rstrip("=")
    enc = crypto.encrypt_at_rest("segredo", master_key_b64=key)
    assert enc.startswith("enc1:")
    assert crypto.decrypt_at_rest(enc, master_key_b64=key) == "segredo"


def test_security_headers_hsts() -> None:
    cfg = get_settings()
    h: dict[str, str] = {}
    apply_security_headers(h, "/runtime/status", cfg)
    assert h.get("Strict-Transport-Security", "").startswith("max-age=")
    assert h.get("Content-Security-Policy")


def test_refresh_rotation_revokes_old(auth_db: str, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("ENVIRONMENT", "development")
    monkeypatch.setenv("REDIS_URL", "")
    get_settings.cache_clear()

    login = runtime_real_auth_engine_v1(
        "t",
        storage_path=auth_db,
        action="login",
        username="admin",
        password="admin",
    )
    old_refresh = login["tokens"]["refresh_token"]
    refreshed = runtime_real_auth_engine_v1(
        "t",
        storage_path=auth_db,
        action="refresh",
        refresh_token=old_refresh,
    )
    assert refreshed.get("refreshed") is True
    again = runtime_real_auth_engine_v1(
        "t",
        storage_path=auth_db,
        action="refresh",
        refresh_token=old_refresh,
    )
    assert again.get("refreshed") is not True


def test_revoke_jti() -> None:
    import time

    jti = "test-jti-1"
    revoke_jti(jti, exp_epoch=time.time() + 60, redis_url=None)
    assert is_revoked(jti, redis_url=None)


def test_sanitize_exception() -> None:
    exc = ValueError("password=leak user@test.com")
    msg = sanitize_exception_message(exc)
    assert "leak" not in msg or "@" not in msg
