"""Swiss, tiebreakers e bracket — suite consolidada."""

from __future__ import annotations

import random

from app.tournament.engine.bracket import BracketEngine
from app.tournament.engine.swiss import SwissEngine, recommended_swiss_rounds
from app.tournament.engine.tiebreakers import (
    apply_match_result,
    recalculate_tiebreakers,
    sort_standings,
)
from app.tournament.types import PairingRecord, Participant


class TestSwissEngine:
    engine = SwissEngine()

    def test_swiss_pairings_8_players(self, sample_participants):
        r1 = self.engine.generate_pairings(1, sample_participants, [], rng=random.Random(42))
        assert len(r1) == 4
        assert all(not p.is_bye for p in r1)

    def test_swiss_pairings_5_players_bye(self):
        players = [
            Participant(id=f"p{i}", user_id=f"u{i}", display_name=f"P{i}", status="checked_in")
            for i in range(1, 6)
        ]
        r1 = self.engine.generate_pairings(1, players, [], rng=random.Random(1))
        assert len([p for p in r1 if p.is_bye]) == 1

    def test_swiss_anti_rematch_three_rounds(self, sample_participants):
        history: list[PairingRecord] = []
        for rnd in range(1, 4):
            generated = self.engine.generate_pairings(rnd, sample_participants, history, rng=random.Random(7))
            for gp in generated:
                history.append(
                    PairingRecord(
                        id=f"pair-{rnd}-{gp.table_number}",
                        round_number=rnd,
                        table_number=gp.table_number,
                        player1_id=gp.player1_id,
                        player2_id=gp.player2_id,
                        is_bye=gp.is_bye,
                        status="confirmed",
                    )
                )
            assert len(generated) == 4

    def test_recommended_rounds_8_players(self):
        assert recommended_swiss_rounds(8) >= 3


class TestTiebreakers:
    def test_tiebreakers_omw_gw_ogw(self):
        p1 = Participant(id="p1", user_id="u1", display_name="A", status="active")
        p2 = Participant(id="p2", user_id="u2", display_name="B", status="active")
        pmap = {"p1": p1, "p2": p2}
        pairing = PairingRecord(
            id="m1",
            round_number=1,
            table_number=1,
            player1_id="p1",
            player2_id="p2",
        )
        apply_match_result(pairing, pmap, player1_wins=2, player2_wins=1)
        recalculate_tiebreakers(pmap, [pairing])
        assert p1.match_points == 3
        assert p2.omw_percent > 0

    def test_sort_by_match_points(self):
        low = Participant(id="a", user_id="u1", display_name="A", match_points=3)
        high = Participant(id="b", user_id="u2", display_name="B", match_points=9)
        ranked = sort_standings([low, high])
        assert ranked[0].id == "b"


class TestBracket:
    engine = BracketEngine()

    def test_bracket_top8_seeding(self):
        top = [
            Participant(id=f"p{i}", user_id=f"u{i}", display_name=f"P{i}", match_points=10 - i)
            for i in range(1, 9)
        ]
        bracket = self.engine.generate_single_elimination("t1", top, 8)
        r1 = sorted([m for m in bracket.matches if m.round_number == 1], key=lambda m: m.match_number)
        assert r1[0].player1_id == "p1"
        assert r1[0].player2_id == "p8"

    def test_bracket_top4_advance_winners(self):
        top = [
            Participant(id=f"p{i}", user_id=f"u{i}", display_name=f"P{i}", match_points=10 - i)
            for i in range(1, 5)
        ]
        bracket = self.engine.generate_single_elimination("t1", top, 4)
        semi = [m for m in bracket.matches if m.round_number == 1]
        assert len(semi) == 2
        for m in semi:
            winner = m.player1_id or m.player2_id
            assert winner
            self.engine.advance_winner(bracket, m.id, winner)
        final = next(m for m in bracket.matches if m.round_number == 2)
        assert final.player1_id and final.player2_id
