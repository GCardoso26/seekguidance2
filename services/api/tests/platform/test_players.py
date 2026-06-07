"""Profile, rankings e achievements — suite consolidada."""

from __future__ import annotations

import re

from app.players.rankings import (
    apply_decay,
    calculate_tournament_points,
    tier_from_points,
)
from app.players.store import HANDLE_RE


class TestProfile:
    def test_handle_regex(self):
        assert HANDLE_RE.match("player_one")
        assert not HANDLE_RE.match("ab")


class TestRankings:
    def test_ranking_calculation_first_place(self):
        pts = calculate_tournament_points(1, 16, is_official=False, is_competitive=True)
        assert pts == int(100 * (16 / 8) * 1.05)

    def test_ranking_decay(self):
        assert apply_decay(2000, 1) == 1900

    def test_tier_from_points(self):
        tier, div = tier_from_points(2100)
        assert tier == "Diamond"
        assert 1 <= div <= 4


class TestAchievements:
    def test_achievement_codes_pattern(self):
        assert re.match(r"^[A-Z0-9_]+$", "FIRST_WIN")
