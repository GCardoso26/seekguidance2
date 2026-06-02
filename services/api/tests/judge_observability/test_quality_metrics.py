"""Testes de quality metrics (Wave 2A)."""

from __future__ import annotations

import pytest
from app.judge.observability import judge_quality_payload


@pytest.mark.asyncio
async def test_quality_payload_structure():
    class _Session:
        async def execute(self, *_a, **_k):
            class _R:
                def mappings(self):
                    return self

                def all(self):
                    return []

            return _R()

    out = await judge_quality_payload(_Session(), days=7)
    assert out["integrity_status"] == "ok"
    assert "cache" in out
    assert "latency" in out
    assert "alerts" in out


@pytest.mark.asyncio
async def test_alert_active_on_high_thumbs_down_48h(monkeypatch):
    rows_window = [
        {"game_slug": "mtg", "rating": "negative", "n": 8},
        {"game_slug": "mtg", "rating": "positive", "n": 2},
    ]

    class _Session:
        call = 0

        async def execute(self, *_a, **_k):
            class _R:
                def __init__(self, data):
                    self._data = data

                def mappings(self):
                    return self

                def all(self):
                    return self._data

            _Session.call += 1
            return _R(rows_window)

    monkeypatch.setattr("app.judge.observability._notify_alert_webhook", lambda _m: None)
    out = await judge_quality_payload(_Session(), days=7)
    mtg = next(g for g in out["games"] if g["game_slug"] == "mtg")
    assert mtg.get("alert_active") is True
    assert "mtg" in out["alerts"]
