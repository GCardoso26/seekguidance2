"""Testes de pontuação de ligas."""

from __future__ import annotations


class TestLeagueScoring:
    def test_accumulated_points(self):
        events = [
            {"points": 100, "multiplier": 1.0},
            {"points": 150, "multiplier": 1.5},
            {"points": 200, "multiplier": 2.0},
        ]
        total = sum(int(e["points"] * e["multiplier"]) for e in events)
        assert total == 100 + 225 + 400

    def test_12_week_season(self):
        weeks = [1.0] * 4 + [1.5] * 4 + [2.0] * 3 + [3.0]
        base_pts = 50
        total = sum(int(base_pts * m) for m in weeks)
        assert total == 50 * 4 + 75 * 4 + 100 * 3 + 150
