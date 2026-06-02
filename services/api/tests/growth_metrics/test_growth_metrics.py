"""Métricas de crescimento."""

from app.judge.growth_metrics import GROWTH_EVENT_TYPES


def test_growth_event_types_defined() -> None:
    assert "login" in GROWTH_EVENT_TYPES
    assert "related_question_clicked" in GROWTH_EVENT_TYPES
    assert "share_created" in GROWTH_EVENT_TYPES
