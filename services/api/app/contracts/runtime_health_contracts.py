"""Contratos de saúde operacional de runtime."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class RuntimeHealthEnvelope(BaseModel):
    """Envelope de saúde alinhado a dashboards e mobile."""

    model_config = {"extra": "allow"}

    scope: str = Field(min_length=1, max_length=256)
    runtime_confidence: float = Field(ge=0.0, le=1.0)
    replay_health_summary: dict[str, Any]
    lineage_snapshot: dict[str, Any] = Field(default_factory=dict)
    assistant_notes: list[str] = Field(default_factory=list)
