"""Testes de métricas de retenção."""

from app.analytics.retention import FUNNEL_EVENTS


def test_funnel_events_tuple():
    assert "page_view" in FUNNEL_EVENTS
    assert "purchase" in FUNNEL_EVENTS
