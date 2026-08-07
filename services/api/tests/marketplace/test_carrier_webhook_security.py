"""Carrier webhook signature — fail-closed."""

from __future__ import annotations

import hashlib
import hmac

from app.api.v1.carrier_api import _verify_melhor_envio_signature


def test_melhor_envio_rejects_missing_secret():
    assert _verify_melhor_envio_signature(b"{}", "sig", None) is False
    assert _verify_melhor_envio_signature(b"{}", "sig", "") is False


def test_melhor_envio_rejects_missing_signature():
    assert _verify_melhor_envio_signature(b"{}", None, "secret") is False


def test_melhor_envio_accepts_valid_hmac():
    secret = "s3cret"
    raw = b'{"event":"order.created"}'
    sig = hmac.new(secret.encode(), raw, hashlib.sha256).hexdigest()
    assert _verify_melhor_envio_signature(raw, sig, secret) is True
    assert _verify_melhor_envio_signature(raw, f"sha256={sig}", secret) is True
    assert _verify_melhor_envio_signature(raw, "deadbeef", secret) is False
