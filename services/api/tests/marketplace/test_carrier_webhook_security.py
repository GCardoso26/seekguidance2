"""Carrier webhook signature — fail-closed."""

from __future__ import annotations

import base64
import hashlib
import hmac

from fastapi.testclient import TestClient

from app.api.v1.carrier_api import MELHOR_ENVIO_WEBHOOK_PATH, _verify_melhor_envio_signature, router
from app.core.config import get_settings
from app.main import app


def test_melhor_envio_rejects_missing_secret():
    assert _verify_melhor_envio_signature(b"{}", "sig", None) is False
    assert _verify_melhor_envio_signature(b"{}", "sig", "") is False


def test_melhor_envio_rejects_missing_signature():
    assert _verify_melhor_envio_signature(b"{}", None, "secret") is False


def test_melhor_envio_accepts_valid_hmac():
    secret = "s3cret"
    raw = b'{"event":"order.created"}'
    digest = hmac.new(secret.encode(), raw, hashlib.sha256).digest()
    sig_hex = digest.hex()
    sig_b64 = base64.b64encode(digest).decode()
    assert _verify_melhor_envio_signature(raw, sig_hex, secret) is True
    assert _verify_melhor_envio_signature(raw, f"sha256={sig_hex}", secret) is True
    assert _verify_melhor_envio_signature(raw, sig_b64, secret) is True
    assert _verify_melhor_envio_signature(raw, "deadbeef", secret) is False


def test_melhor_envio_webhook_route_allows_get_head_post():
    """Cadastro no painel Melhor Envio sonda a URL; POST-only gerava E-WBH-0002 / 405."""
    methods: set[str] = set()
    for route in router.routes:
        if getattr(route, "path", None) == MELHOR_ENVIO_WEBHOOK_PATH:
            methods |= set(getattr(route, "methods", None) or [])
    assert {"GET", "HEAD", "POST", "OPTIONS"} <= methods


def test_melhor_envio_webhook_probe_get_returns_200():
    client = TestClient(app)
    r = client.get(MELHOR_ENVIO_WEBHOOK_PATH)
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_melhor_envio_webhook_probe_head_returns_200():
    client = TestClient(app)
    r = client.head(MELHOR_ENVIO_WEBHOOK_PATH)
    assert r.status_code == 200


def test_melhor_envio_webhook_unsigned_post_is_probe_200():
    """Cadastro no painel POSTa sem HMAC; não pode abrir Postgres (500 / E-WBH-0002)."""
    client = TestClient(app)
    r = client.post(
        MELHOR_ENVIO_WEBHOOK_PATH,
        content=b'{"event":"order.created"}',
        headers={"Content-Type": "application/json", "User-Agent": "Melhor Envio Webhooks/1.0"},
    )
    assert r.status_code == 200
    assert r.json()["probe"] is True


def test_melhor_envio_signed_probe_without_shipment_id_skips_db(monkeypatch):
    """Painel assina a sonda; sem data.id não pode ir ao Postgres (500)."""
    secret = "s3cret"
    monkeypatch.setenv("MELHOR_ENVIO_WEBHOOK_SECRET", secret)
    get_settings.cache_clear()
    try:
        raw = b'{"event":"order.created"}'
        sig = base64.b64encode(hmac.new(secret.encode(), raw, hashlib.sha256).digest()).decode()
        client = TestClient(app)
        r = client.post(
            MELHOR_ENVIO_WEBHOOK_PATH,
            content=raw,
            headers={
                "Content-Type": "application/json",
                "X-ME-Signature": sig,
                "User-Agent": "Melhor Envio Webhooks/1.0",
            },
        )
        assert r.status_code == 200
        assert r.json()["probe"] is True
    finally:
        get_settings.cache_clear()


def test_melhor_envio_signed_event_db_failure_still_200(monkeypatch):
    secret = "s3cret"
    monkeypatch.setenv("MELHOR_ENVIO_WEBHOOK_SECRET", secret)
    get_settings.cache_clear()

    def _boom():
        raise RuntimeError("database down")

    monkeypatch.setattr("app.api.v1.carrier_api.get_session_factory", _boom)
    try:
        raw = b'{"event":"order.posted","data":{"id":"ord-1"}}'
        sig = base64.b64encode(hmac.new(secret.encode(), raw, hashlib.sha256).digest()).decode()
        client = TestClient(app)
        r = client.post(
            MELHOR_ENVIO_WEBHOOK_PATH,
            content=raw,
            headers={"Content-Type": "application/json", "X-ME-Signature": sig},
        )
        assert r.status_code == 200
        assert r.json()["persist_error"] is True
    finally:
        get_settings.cache_clear()
