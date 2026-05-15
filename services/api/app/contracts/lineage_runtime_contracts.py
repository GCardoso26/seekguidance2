"""Contratos de lineage runtime."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class LineageAnchorPayload(BaseModel):
    """Âncora de lineage transportável (leve)."""

    model_config = {"extra": "forbid"}

    replay_lineage_id: str = Field(min_length=1, max_length=256)
    anchor_token: str = Field(min_length=1, max_length=256)
    metadata: dict[str, Any] = Field(default_factory=dict)
