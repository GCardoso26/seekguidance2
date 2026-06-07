"""Testes de webhooks."""

from __future__ import annotations

from app.public_api.webhooks import sign_payload


class TestWebhooks:
    def test_hmac_signature(self):
        sig = sign_payload("secret", b'{"event":"test"}')
        assert len(sig) == 64
        assert sign_payload("secret", b'{"event":"test"}') == sig
