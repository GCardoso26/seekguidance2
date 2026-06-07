"""
E2E: 8 jogadores → 3 rodadas Swiss → Top 4 bracket → final.

Usa o motor real (sem DB). Marca @pytest.mark.e2e para CI rápido.
"""

from __future__ import annotations

import random
from unittest.mock import AsyncMock

import pytest
from app.tournament.engine.bracket import BracketEngine
from app.tournament.engine.swiss import SwissEngine
from app.tournament.engine.tiebreakers import apply_match_result, recalculate_tiebreakers, sort_standings
from app.tournament.types import PairingRecord, Participant


def _participants(n: int) -> list[Participant]:
    return [
        Participant(
            id=f"p{i}",
            user_id=f"player{i}",
            display_name=f"Player {i}",
            status="checked_in",
        )
        for i in range(1, n + 1)
    ]


def _to_history(generated, rnd: int) -> list[PairingRecord]:
    return [
        PairingRecord(
            id=f"pair-{rnd}-{gp.table_number}",
            round_number=rnd,
            table_number=gp.table_number,
            player1_id=gp.player1_id,
            player2_id=gp.player2_id,
            is_bye=gp.is_bye,
            status="confirmed",
        )
        for gp in generated
    ]


@pytest.mark.e2e
class TestTournamentFlowE2E:
    def test_complete_swiss_to_bracket_flow(self):
        """Cenário: MTG Pioneer, 8 jogadores, 3 rodadas, Top 4."""
        swiss = SwissEngine()
        bracket_engine = BracketEngine()
        players = _participants(8)
        pmap = {p.id: p for p in players}
        history: list[PairingRecord] = []

        for rnd in range(1, 4):
            generated = swiss.generate_pairings(rnd, players, history, rng=random.Random(99))
            assert len(generated) == 4

            for i, gp in enumerate(generated):
                record = PairingRecord(
                    id=f"sim-{rnd}-{gp.table_number}",
                    round_number=rnd,
                    table_number=gp.table_number,
                    player1_id=gp.player1_id,
                    player2_id=gp.player2_id,
                    is_bye=gp.is_bye,
                )
                if gp.is_bye:
                    apply_match_result(record, pmap, player1_wins=0, player2_wins=0)
                elif i % 2 == 0:
                    apply_match_result(record, pmap, player1_wins=2, player2_wins=1)
                else:
                    apply_match_result(record, pmap, player1_wins=1, player2_wins=2)
                history.append(_to_history([gp], rnd)[0])

            recalculate_tiebreakers(pmap, history)

        standings = sort_standings(players)
        assert len(standings) == 8
        assert standings[0].match_points >= standings[1].match_points

        bracket = bracket_engine.generate_single_elimination("e2e-tournament", standings, 4)
        semi = [m for m in bracket.matches if m.round_number == 1]
        assert len(semi) == 2
        assert semi[0].player1_id == standings[0].id
        assert semi[0].player2_id == standings[3].id

        for m in semi:
            winner = m.player1_id or m.player2_id
            bracket_engine.advance_winner(bracket, m.id, winner)

        final = next(m for m in bracket.matches if m.round_number == 2)
        assert final.player1_id and final.player2_id

        bracket_engine.advance_winner(bracket, final.id, final.player1_id)
        assert final.winner_id == final.player1_id
        assert final.status == "completed"

    def test_http_create_tournament_smoke(self, api_client_with_db, organizer_headers, sample_tournament_data):
        """Smoke HTTP: criar torneio com mock DB."""
        client, db, make_result = api_client_with_db
        fmt_row = {
            "code": "PIONEER",
            "name": "Pioneer",
            "default_timer_minutes": 50,
            "default_match_type": "BO3",
            "default_swiss_rounds": "3",
            "default_top_cut": 4,
            "decklist_required": True,
        }
        created = {
            "id": "t-e2e-1",
            "name": sample_tournament_data["name"],
            "game_code": "MTG",
            "format_code": "PIONEER",
            "status": "draft",
            "top_cut": 4,
        }

        async def execute(stmt, params=None):
            sql = str(stmt)
            if "game_formats" in sql:
                return make_result(first=fmt_row)
            if "INSERT INTO" in sql:
                return make_result(first=created)
            return make_result()

        db.execute = AsyncMock(side_effect=execute)

        res = client.post(
            "/runtime/judge/tournaments",
            headers=organizer_headers,
            json=sample_tournament_data,
        )
        assert res.status_code == 200
        body = res.json()
        assert body["game_code"] == "MTG"
        assert body["format_code"] == "PIONEER"
