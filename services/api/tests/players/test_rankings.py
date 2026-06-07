"""Testes do sistema de ranking."""

from __future__ import annotations

from app.players.rankings import (
    apply_decay,
    base_points_for_placement,
    calculate_tournament_points,
    tier_from_points,
)


class TestRankingPoints:
    def test_first_place_16_players(self):
        pts = calculate_tournament_points(1, 16, is_official=False, is_competitive=True)
        assert pts == int(100 * (16 / 8) * 1.05)

    def test_first_place_official_perfect(self):
        pts = calculate_tournament_points(1, 16, is_official=True, perfect_run=True)
        base = int(100 * (16 / 8))
        expected = int(base * 1.10 * 1.05 * 1.15)
        assert pts == expected

    def test_placement_9_16_players(self):
        pts = base_points_for_placement(12, 32)
        assert pts == int(20 * (32 / 8))

    def test_tier_diamond(self):
        tier, div = tier_from_points(2100)
        assert tier == "Diamond"
        assert 1 <= div <= 4

    def test_decay_one_month(self):
        assert apply_decay(2000, 1) == 1900

    def test_decay_many_months_stays_non_negative(self):
        decayed = apply_decay(520, 12)
        assert 0 <= decayed < 520
