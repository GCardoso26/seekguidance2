"""Testes de conquistas."""

from __future__ import annotations

from app.players.achievements import codes_to_unlock


class TestAchievements:
    def test_first_tournament(self):
        codes = codes_to_unlock({"tournaments_played": 1, "placement": 8, "game_code": "MTG"})
        assert "FIRST_TOURNAMENT" in codes

    def test_streak_5(self):
        codes = codes_to_unlock(
            {
                "tournaments_played": 10,
                "tournaments_won": 5,
                "win_streak": 5,
                "placement": 1,
                "game_code": "MTG",
                "distinct_games": 1,
            }
        )
        assert "STREAK_5" in codes

    def test_champion(self):
        codes = codes_to_unlock(
            {
                "tournaments_played": 3,
                "tournaments_won": 1,
                "placement": 1,
                "game_code": "POKEMON",
                "win_streak": 1,
            }
        )
        assert "TOP_CUT_1" in codes
        assert "FIRST_WIN" in codes

    def test_multi_game(self):
        codes = codes_to_unlock(
            {
                "tournaments_played": 5,
                "placement": 10,
                "game_code": "SWU",
                "distinct_games": 4,
            }
        )
        assert "MULTI_GAME" in codes

    def test_perfect_swiss(self):
        codes = codes_to_unlock(
            {
                "tournaments_played": 2,
                "placement": 1,
                "match_wins": 9,
                "match_losses": 0,
                "game_code": "MTG",
            }
        )
        assert "PERFECT_SWISS" in codes
