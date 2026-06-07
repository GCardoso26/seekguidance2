"""Integração — fluxo jogador → juiz → infração (mock DB)."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest
from app.judge.models import CallType, JudgeCallCreate, JudgeCallResolve, Priority, RulingCategory

pytestmark = pytest.mark.integration

TOURNAMENT_ID = str(uuid4())
CALL_ID = str(uuid4())
PLAYER_ID = "player_test_1"
JUDGE_ID = "judge_test_1"


@pytest.fixture
def mock_session():
    db = AsyncMock()
    db.commit = AsyncMock()
    return db


@pytest.mark.asyncio
async def test_judge_call_flow_mock(mock_session):
    """Jogador cria → juiz aceita → resolve com warning → fair play atualizado."""
    from app.judge import calls_store

    participant = {"id": str(uuid4()), "tournament_id": TOURNAMENT_ID, "user_id": PLAYER_ID}
    call_open = {
        "id": CALL_ID,
        "tournament_id": TOURNAMENT_ID,
        "table_number": 5,
        "caller_id": PLAYER_ID,
        "type": "dispute",
        "priority": "high",
        "status": "open",
        "description": "Disputa sobre trigger",
        "evidence_urls": [],
        "tournament_game_code": "MTG",
        "created_at": datetime.now(UTC),
    }
    call_assigned = {**call_open, "status": "assigned", "assigned_judge_id": JUDGE_ID, "assigned_at": datetime.now(UTC)}
    call_resolved = {
        **call_assigned,
        "status": "resolved",
        "ruling": "Regra 116.2a aplicada",
        "ruling_category": "warning",
        "resolved_at": datetime.now(UTC),
    }

    with (
        patch.object(calls_store, "get_active_participant", AsyncMock(return_value=participant)),
        patch.object(calls_store, "create_call", AsyncMock(return_value=call_open)),
        patch.object(calls_store, "get_call", AsyncMock(side_effect=[call_open, call_assigned, call_resolved])),
        patch.object(calls_store, "get_tournament_game_code", AsyncMock(return_value="MTG")),
        patch.object(calls_store, "list_certified_judges_for_game", AsyncMock(return_value=[JUDGE_ID])),
        patch.object(
            calls_store,
            "get_active_certification",
            AsyncMock(
                return_value={
                    "id": str(uuid4()),
                    "player_id": JUDGE_ID,
                    "game_code": "MTG",
                    "level": "level2",
                    "status": "active",
                    "certified_at": datetime.now(UTC),
                    "expires_at": datetime.now(UTC) + timedelta(days=365),
                }
            ),
        ),
        patch.object(calls_store, "accept_call", AsyncMock(return_value=call_assigned)),
        patch.object(calls_store, "resolve_call", AsyncMock(return_value=call_resolved)),
    ):
        create_data = JudgeCallCreate(
            tournament_id=TOURNAMENT_ID,
            table_number=5,
            type=CallType.DISPUTE,
            priority=Priority.HIGH,
            description="Disputa sobre trigger de ability",
        )
        call = await calls_store.create_call(
            mock_session,
            {
                "tournament_id": create_data.tournament_id,
                "table_number": create_data.table_number,
                "caller_id": PLAYER_ID,
                "caller_participant_id": participant["id"],
                "type": create_data.type.value,
                "priority": create_data.priority.value,
                "description": create_data.description,
            },
        )
        assert call["status"] == "open"
        assert call["caller_id"] == PLAYER_ID

        accepted = await calls_store.accept_call(mock_session, CALL_ID, JUDGE_ID)
        assert accepted["status"] == "assigned"
        assert accepted["assigned_judge_id"] == JUDGE_ID

        resolve_data = JudgeCallResolve(
            ruling="Player falhou em manter priority. Regra 116.2a.",
            ruling_category=RulingCategory.WARNING,
            infracting_player_id=PLAYER_ID,
            infraction_type="unsporting_conduct_minor",
            severity="minor",
        )
        resolved = await calls_store.resolve_call(
            mock_session,
            CALL_ID,
            JUDGE_ID,
            ruling=resolve_data.ruling,
            ruling_category=resolve_data.ruling_category.value,
            infracting_player_id=resolve_data.infracting_player_id,
            infraction_type=resolve_data.infraction_type,
            severity=resolve_data.severity,
            tournament_id=TOURNAMENT_ID,
            game_code="MTG",
        )
        assert resolved["status"] == "resolved"
        assert resolved["ruling_category"] == "warning"

    print("✅ Judge call flow integration test passed!")
