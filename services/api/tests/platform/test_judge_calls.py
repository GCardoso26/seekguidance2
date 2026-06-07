"""Testes unitários — modelos e lógica de chamadas de juiz."""

from __future__ import annotations

import pytest
from app.judge.fair_play import PENALTY_DECAY
from app.judge.models import (
    CallType,
    JudgeCallCreate,
    JudgeCallResolve,
    Priority,
    RulingCategory,
)


class TestJudgeModels:
    def test_call_type_values(self):
        assert CallType.DISPUTE.value == "dispute"
        assert len(CallType) == 7

    def test_priority_default(self):
        body = JudgeCallCreate(
            tournament_id="00000000-0000-0000-0000-000000000001",
            table_number=3,
            type=CallType.RULES_QUESTION,
            description="Como funciona stack?",
        )
        assert body.priority == Priority.MEDIUM

    def test_resolve_penalty_fields(self):
        body = JudgeCallResolve(
            ruling="Warning aplicado",
            ruling_category=RulingCategory.WARNING,
            infracting_player_id="player1",
            infraction_type="slow_play",
            severity="minor",
        )
        assert body.ruling_category == RulingCategory.WARNING


class TestFairPlayDecay:
    def test_penalty_decay_values(self):
        assert PENALTY_DECAY["warning"] == 0.10
        assert PENALTY_DECAY["disqualification"] == 1.00

    @pytest.mark.parametrize(
        "penalty,expected",
        [
            ("warning", 0.10),
            ("game_loss", 0.25),
            ("match_loss", 0.50),
            ("disqualification", 1.00),
        ],
    )
    def test_all_penalties_have_decay(self, penalty: str, expected: float):
        assert PENALTY_DECAY[penalty] == expected
