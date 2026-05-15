"""Contratos estáveis para API de replay runtime (alinhamento OpenAPI ↔ TS)."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class ReplayRefBody(BaseModel):
    """Corpo base para operações de replay."""

    model_config = {"extra": "forbid"}

    replay_ref: str = Field(min_length=1, max_length=512)
    replay_lineage_id: str | None = Field(default=None, max_length=256)
    replay_request_id: str | None = Field(default=None, max_length=128)


class ReplayValidateIn(ReplayRefBody):
    """Entrada de validação assistida."""

    payload_hints: dict[str, Any] = Field(default_factory=dict)


class ReplayHealthOut(BaseModel):
    """Resposta agregada de saúde (campos estáveis para clientes)."""

    model_config = {"extra": "allow"}

    replay_request_id: str
    replay_lineage_id: str | None
    runtime_health_summary: dict[str, Any]
    contradiction_summary: dict[str, Any]
    deterministic_replay_hints: dict[str, Any]
    assistant_notes: list[str]


class ReplayOperationOut(BaseModel):
    """Envelope comum pós-operação replay."""

    model_config = {"extra": "allow"}

    replay_request_id: str
    replay_lineage_id: str | None
    replay_consistency_summary: dict[str, Any]
    contradiction_summary: dict[str, Any]
    payload: dict[str, Any]
