"""Modelos Pydantic — Painel Juiz Digital (chamadas, certificações, infrações)."""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field


class CallType(str, Enum):
    RULES_QUESTION = "rules_question"
    DISPUTE = "dispute"
    CHEATING_SUSPICION = "cheating_suspicion"
    SLOW_PLAY = "slow_play"
    UNSPORTING_CONDUCT = "unsporting_conduct"
    DECK_ERROR = "deck_error"
    OTHER = "other"


class Priority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class RulingCategory(str, Enum):
    WARNING = "warning"
    GAME_LOSS = "game_loss"
    MATCH_LOSS = "match_loss"
    DISQUALIFICATION = "disqualification"
    NONE = "none"
    RULE_CLARIFICATION = "rule_clarification"


class JudgeCallCreate(BaseModel):
    tournament_id: str
    round_id: Optional[str] = None
    table_number: int = Field(..., ge=1)
    type: CallType
    priority: Priority = Priority.MEDIUM
    description: str = Field(..., min_length=3)
    evidence_urls: Optional[List[str]] = None


class JudgeCallResolve(BaseModel):
    ruling: str = Field(..., min_length=1)
    ruling_category: RulingCategory
    infracting_player_id: Optional[str] = None
    infraction_type: Optional[str] = None
    severity: Optional[str] = None


class EscalationData(BaseModel):
    reason: str = Field(..., min_length=3)


class JudgeCallResponse(BaseModel):
    id: str
    tournament_id: str
    round_id: Optional[str] = None
    table_number: int
    caller_id: Optional[str] = None
    type: str
    priority: str
    status: str
    description: str
    evidence_urls: List[str] = Field(default_factory=list)
    assigned_judge_id: Optional[str] = None
    ruling: Optional[str] = None
    ruling_category: Optional[str] = None
    created_at: datetime
    assigned_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    tournament_name: Optional[str] = None
    tournament_game_code: Optional[str] = None
    caller_handle: Optional[str] = None
    round_number: Optional[int] = None

    model_config = {"from_attributes": True}


class JudgeCertificationResponse(BaseModel):
    id: str
    player_id: str
    game_code: str
    level: str
    status: str
    certified_at: datetime
    expires_at: Optional[datetime] = None
