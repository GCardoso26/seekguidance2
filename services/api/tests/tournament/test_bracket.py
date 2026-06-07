"""Testes de bracket Top Cut."""

from __future__ import annotations

from app.tournament.engine.bracket import BracketEngine
from app.tournament.types import Participant


def _top(n: int) -> list[Participant]:
    return [
        Participant(
            id=f"p{i}",
            user_id=f"u{i}",
            display_name=f"Player {i}",
            status="active",
            match_points=9 - i,
        )
        for i in range(1, n + 1)
    ]


class TestBracketEngine:
    engine = BracketEngine()

    def test_top_8_seeding(self):
        bracket = self.engine.generate_single_elimination("t1", _top(8), 8)
        r1 = [m for m in bracket.matches if m.round_number == 1]
        assert len(r1) == 4
        seeds = [(m.player1_id, m.player2_id) for m in sorted(r1, key=lambda x: x.match_number)]
        assert seeds[0] == ("p1", "p8")
        assert seeds[1] == ("p4", "p5")

    def test_avanco_vencedor(self):
        bracket = self.engine.generate_single_elimination("t1", _top(4), 4)
        r1_match = next(m for m in bracket.matches if m.round_number == 1 and m.match_number == 1)
        self.engine.advance_winner(bracket, r1_match.id, "p1")
        assert r1_match.winner_id == "p1"
        if r1_match.next_match_id:
            nxt = next(m for m in bracket.matches if m.id == r1_match.next_match_id)
            assert "p1" in (nxt.player1_id, nxt.player2_id)
