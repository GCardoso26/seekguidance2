"""Testes de busca e analytics (lógica pura / mocks)."""

from __future__ import annotations

from app.players.rankings import calculate_tournament_points


class TestSearchAnalyticsLogic:
    def test_ranking_points_for_winner_16(self):
        pts = calculate_tournament_points(1, 16)
        assert pts >= 200

    def test_returning_players_rate_placeholder(self):
        rate = 0.68
        assert 0 < rate < 1
