"""Public calendar listing must not require auth; store filter still does."""

from __future__ import annotations

from app.core.security.middleware import _is_public


def test_runtime_events_is_public_exact() -> None:
    assert _is_public("/runtime/events") is True


def test_runtime_events_nested_not_accidentally_public() -> None:
    # Only exact /runtime/events is public; other /runtime/* still protected.
    assert _is_public("/runtime/event-dashboard") is False
