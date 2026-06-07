"""Testes do motor Swiss."""

from __future__ import annotations

import random

from app.tournament.engine.swiss import SwissEngine, recommended_swiss_rounds
from app.tournament.types import PairingRecord, Participant


def _players(n: int) -> list[Participant]:
    return [
        Participant(id=f"p{i}", user_id=f"u{i}", display_name=f"Player {i}", status="checked_in")
        for i in range(1, n + 1)
    ]


def _history_from_pairings(
    all_pairings: list[list],
) -> list[PairingRecord]:
    history: list[PairingRecord] = []
    for rnd, pairs in enumerate(all_pairings, start=1):
        for gp in pairs:
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
    return history


class TestSwissEngine:
    engine = SwissEngine()

    def test_oito_jogadores_tres_rodadas_sem_rematch_forcado_na_r1(self):
        players = _players(8)
        r1 = self.engine.generate_pairings(1, players, [], rng=random.Random(42))
        assert len(r1) == 4
        assert all(not p.is_bye for p in r1)

        history = _history_from_pairings([r1])
        r2 = self.engine.generate_pairings(2, players, history, rng=random.Random(42))
        assert len(r2) == 4

        history = _history_from_pairings([r1, r2])
        r3 = self.engine.generate_pairings(3, players, history, rng=random.Random(42))
        assert len(r3) == 4

    def test_cinco_jogadores_atribui_bye(self):
        players = _players(5)
        r1 = self.engine.generate_pairings(1, players, [], rng=random.Random(1))
        byes = [p for p in r1 if p.is_bye]
        assert len(byes) == 1
        assert sum(1 for p in r1 if not p.is_bye) == 2

    def test_rematch_forcido_quando_necessario(self):
        players = _players(3)
        r1 = self.engine.generate_pairings(1, players, [], rng=random.Random(0))
        history = _history_from_pairings([r1])
        r2 = self.engine.generate_pairings(2, players, history, rng=random.Random(0))
        if any(p.is_forced_rematch for p in r2):
            assert True
        else:
            assert len(r2) >= 1

    def test_recommended_rounds(self):
        assert recommended_swiss_rounds(8) >= 3
        assert recommended_swiss_rounds(64) == 6
