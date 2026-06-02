"""Rate limit diferenciado autenticado vs anónimo."""

from unittest.mock import MagicMock

from app.core.rate_limit import allow_request, judge_query_client_key


def _request(*, auth: str | None = None, user_header: str | None = None, host: str = "1.2.3.4"):
    req = MagicMock()
    req.headers = {}
    if auth:
        req.headers["Authorization"] = auth
    if user_header:
        req.headers["X-Judge-User-Id"] = user_header
    req.client = MagicMock()
    req.client.host = host
    return req


def test_judge_query_key_anon() -> None:
    key, is_auth = judge_query_client_key(_request())
    assert is_auth is False
    assert key.startswith("anon:")


def test_judge_query_key_with_user_header() -> None:
    key, is_auth = judge_query_client_key(_request(user_header="user-uuid-123"))
    assert is_auth is True
    assert "user-uuid-123" in key


def test_anon_limit_stricter_than_auth_bucket() -> None:
    import uuid

    suffix = uuid.uuid4().hex[:8]
    anon_key = f"anon:test-{suffix}"
    auth_key = f"auth:test-{suffix}"
    for _ in range(20):
        assert allow_request("judge", anon_key, limit=20, window_seconds=60, redis_url=None)
    assert not allow_request("judge", anon_key, limit=20, window_seconds=60, redis_url=None)
    for _ in range(60):
        assert allow_request("judge", auth_key, limit=60, window_seconds=60, redis_url=None)
    assert not allow_request("judge", auth_key, limit=60, window_seconds=60, redis_url=None)
