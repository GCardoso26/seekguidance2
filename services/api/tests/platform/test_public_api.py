"""API key auth e rate limit — suite consolidada."""

from __future__ import annotations

from app.public_api.auth import generate_api_key, hash_api_key


class TestPublicApi:
    def test_api_key_validation_format(self):
        raw, key_hash, prefix = generate_api_key()
        assert raw.startswith("jtcg_live_")
        assert hash_api_key(raw) == key_hash

    def test_api_key_hash_deterministic(self):
        assert hash_api_key("jtcg_test") == hash_api_key("jtcg_test")

    def test_require_api_key_importable(self):
        from app.public_api.auth import require_api_key

        assert callable(require_api_key)
