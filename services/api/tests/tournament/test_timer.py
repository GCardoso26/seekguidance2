"""Testes do timer de rodada."""

from __future__ import annotations

from unittest.mock import patch

from app.tournament.timer import _MEMORY_TIMERS, RoundTimer


class TestRoundTimer:
    def setup_method(self):
        _MEMORY_TIMERS.clear()

    def _no_redis(self):
        return patch("app.tournament.timer._redis_client", return_value=None)

    def test_iniciar_e_remaining(self):
        with self._no_redis():
            timer = RoundTimer("round-1", duration_minutes=50)
            timer.start()
        assert timer.status == "running"
        assert timer.remaining_seconds() <= 50 * 60
        assert timer.remaining_seconds() > 50 * 60 - 5

    def test_extend(self):
        with self._no_redis():
            timer = RoundTimer("round-2", duration_minutes=50)
            timer.start()
            before = timer.remaining_seconds()
            timer.extend(5)
            assert timer.remaining_seconds() >= before

    def test_end(self):
        with self._no_redis():
            timer = RoundTimer("round-3", duration_minutes=1)
            timer.start()
            payload = timer.end()
            assert payload["status"] == "ended"
            assert timer.status == "ended"

    def test_load_persisted(self):
        with self._no_redis():
            t1 = RoundTimer("round-4", 10)
            t1.start()
            t2 = RoundTimer.load("round-4", 10)
            assert t2.status == "running"
