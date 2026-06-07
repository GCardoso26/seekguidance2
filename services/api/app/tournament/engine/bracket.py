"""Geração de bracket eliminatório (Top Cut)."""

from __future__ import annotations

import math
import uuid

from app.tournament.engine.tiebreakers import sort_standings
from app.tournament.types import BracketMatch, BracketState, Participant


def _seed_order(n: int) -> list[tuple[int, int]]:
    """Standard seeding pairs for single elimination (1vN, etc.)."""
    if n == 4:
        return [(0, 3), (1, 2)]
    if n == 8:
        return [(0, 7), (3, 4), (1, 6), (2, 5)]
    if n == 16:
        return [
            (0, 15), (7, 8), (3, 12), (4, 11),
            (1, 14), (6, 9), (2, 13), (5, 10),
        ]
    pairs = []
    for i in range(n // 2):
        pairs.append((i, n - 1 - i))
    return pairs


class BracketEngine:
    def generate_single_elimination(
        self,
        tournament_id: str,
        top_participants: list[Participant],
        top_cut: int,
    ) -> BracketState:
        ranked = sort_standings(top_participants)[:top_cut]
        n = len(ranked)
        if n < 2:
            raise ValueError("Top cut requer pelo menos 2 jogadores")

        bracket_size = 2 ** math.ceil(math.log2(n))
        bracket_id = str(uuid.uuid4())
        matches: list[BracketMatch] = []
        match_ids: list[list[str]] = []

        rounds = int(math.log2(bracket_size))
        seeds = _seed_order(bracket_size)

        # Round 1
        r1: list[str] = []
        match_num = 1
        for a, b in seeds:
            mid = str(uuid.uuid4())
            r1.append(mid)
            p1 = ranked[a].id if a < n else None
            p2 = ranked[b].id if b < n else None
            matches.append(
                BracketMatch(
                    id=mid,
                    round_number=1,
                    match_number=match_num,
                    player1_id=p1,
                    player2_id=p2,
                    table_number=match_num,
                )
            )
            match_num += 1
        match_ids.append(r1)

        # Subsequent rounds (empty slots filled when winners advance)
        for r in range(2, rounds + 1):
            prev_count = len(match_ids[-1])
            round_ids: list[str] = []
            for m in range(prev_count // 2):
                mid = str(uuid.uuid4())
                round_ids.append(mid)
                left = match_ids[-1][m * 2]
                right = match_ids[-1][m * 2 + 1]
                matches.append(
                    BracketMatch(
                        id=mid,
                        round_number=r,
                        match_number=m + 1,
                        player1_id=None,
                        player2_id=None,
                        table_number=m + 1,
                    )
                )
                for bm in matches:
                    if bm.id == left:
                        bm.next_match_id = mid
                    if bm.id == right:
                        bm.next_match_id = mid
            match_ids.append(round_ids)

        return BracketState(
            id=bracket_id,
            tournament_id=tournament_id,
            top_cut=top_cut,
            matches=matches,
        )

    def advance_winner(self, bracket: BracketState, match_id: str, winner_id: str) -> None:
        match = next(m for m in bracket.matches if m.id == match_id)
        match.winner_id = winner_id
        match.status = "completed"
        if match.next_match_id:
            nxt = next(m for m in bracket.matches if m.id == match.next_match_id)
            if nxt.player1_id is None:
                nxt.player1_id = winner_id
            elif nxt.player2_id is None:
                nxt.player2_id = winner_id
