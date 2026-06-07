"""Testes do job de decay."""

from __future__ import annotations

from app.players.rankings import apply_decay, tier_from_points


class TestRankingDecayJob:
    def test_decay_reduces_points(self):
        assert apply_decay(2000, 1) == 1900

    def test_tier_recalculated_after_decay(self):
        tier, _ = tier_from_points(apply_decay(2100, 2))
        assert tier in ("Diamond", "Platinum", "Gold", "Silver", "Bronze", "Mythic", "Legend")
