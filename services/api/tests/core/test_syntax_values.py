"""Testes de autocomplete de valores de syntax search."""

from app.core.search.syntax_parser import syntax_parser
from app.core.search.syntax_values import VALID_SYNTAX_VALUE_FIELDS, _highlight


def test_valid_syntax_value_fields():
    assert "set" in VALID_SYNTAX_VALUE_FIELDS
    assert "artist" in VALID_SYNTAX_VALUE_FIELDS
    assert "name" not in VALID_SYNTAX_VALUE_FIELDS


def test_validate_syntax_value_color_known():
    ok, suggestion = syntax_parser.validate_syntax_value("color", "W", "mtg")
    assert ok is True
    assert suggestion is None


def test_validate_syntax_value_color_typo_suggestion():
    ok, suggestion = syntax_parser.validate_syntax_value("color", "bl", "mtg")
    assert ok is False
    assert suggestion == "Blue"


def test_validate_syntax_value_foil_boolean():
    ok, _ = syntax_parser.validate_syntax_value("foil", "true", "mtg")
    assert ok is True
    ok2, _ = syntax_parser.validate_syntax_value("foil", "maybe", "mtg")
    assert ok2 is False


def test_highlight_matching_query():
    result = _highlight("Dominaria United", "dom")
    assert result is not None
    assert "<b>Dom</b>" in result


def test_syntax_values_cache_roundtrip(monkeypatch):
    from app.core.search import syntax_values_cache as cache

    stored: dict[str, str] = {}

    class FakeRedis:
        def get(self, key):
            return stored.get(key)

        def setex(self, key, ttl, value):
            stored[key] = value

    monkeypatch.setattr(cache, "_get_redis", lambda _url: FakeRedis())
    monkeypatch.setattr(
        cache,
        "get_settings",
        lambda: type("S", (), {"redis_url": "redis://local"})(),
    )

    payload = {"field": "set", "values": [{"value": "CMD", "count": 1}]}
    cache.set_syntax_values_cache("mtg", "set", "cmd", payload)
    got = cache.get_syntax_values_cache("mtg", "set", "cmd")
    assert got is not None
    assert got["values"][0]["value"] == "CMD"
