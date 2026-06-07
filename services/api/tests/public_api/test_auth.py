"""Testes de API key."""

from __future__ import annotations

from app.public_api.auth import generate_api_key, hash_api_key


class TestApiKeyAuth:
    def test_generate_key_format(self):
        raw, key_hash, prefix = generate_api_key()
        assert raw.startswith("jtcg_live_")
        assert hash_api_key(raw) == key_hash
        assert raw.startswith(prefix)

    def test_hash_deterministic(self):
        assert hash_api_key("test") == hash_api_key("test")
