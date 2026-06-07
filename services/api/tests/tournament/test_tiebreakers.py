"""Testes de tiebreakers."""

from __future__ import annotations

from app.tournament.engine.tiebreakers import (
    apply_match_result,
    game_win_percent,
    match_win_percent,
    recalculate_tiebreakers,
    sort_standings,
)
from app.tournament.types import PairingRecord, Participant


class TestTiebreakers:
    def test_match_win_percent(self):
        p = Participant(id="p1", user_id="u1", display_name="A", match_wins=2, match_losses=1)
        assert round(match_win_percent(p), 1) == 66.7

    def test_game_win_percent(self):
        p = Participant(id="p1", user_id="u1", display_name="A", game_wins=6, game_losses=3)
        assert round(game_win_percent(p), 1) == 66.7

    def test_bye_tres_pontos(self):
        p1 = Participant(id="p1", user_id="u1", display_name="A", status="checked_in")
        pairing = PairingRecord(
            id="b1", round_number=1, table_number=1,
            player1_id="p1", player2_id=None, is_bye=True,
        )
        apply_match_result(pairing, {"p1": p1}, player1_wins=0, player2_wins=0)
        assert p1.match_points == 3
        assert p1.match_wins == 1

    def test_omw_ogw_recalculo(self):
        p1 = Participant(id="p1", user_id="u1", display_name="A", status="active")
        p2 = Participant(id="p2", user_id="u2", display_name="B", status="active")
        pmap = {"p1": p1, "p2": p2}
        pairing = PairingRecord(
            id="m1", round_number=1, table_number=1,
            player1_id="p1", player2_id="p2", status="pending",
        )
        apply_match_result(pairing, pmap, player1_wins=2, player2_wins=1)
        recalculate_tiebreakers(pmap, [pairing])
        assert p2.omw_percent > 0
        assert p1.ogw_percent > 0

    def test_sort_standings(self):
        a = Participant(id="a", user_id="u1", display_name="A", match_points=6, omw_percent=50)
        b = Participant(id="b", user_id="u2", display_name="B", match_points=9, omw_percent=40)
        ranked = sort_standings([a, b])
        assert ranked[0].id == "b"
