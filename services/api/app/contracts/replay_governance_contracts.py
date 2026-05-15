"""Contratos de governança executável de replay."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class ReplayGovernanceScores(BaseModel):
    """Scores e resumos explainability-first (sem veredito jurídico)."""

    model_config = {"extra": "allow"}

    replayability_score: float = Field(ge=0.0, le=1.0)
    lineage_consistency_score: float = Field(ge=0.0, le=1.0)
    snapshot_integrity_ok: bool
    drift_summary: dict[str, Any]
    contradiction_summary: dict[str, Any]
    deterministic_alignment_score: float = Field(ge=0.0, le=1.0)
    assistant_notes: list[str] = Field(default_factory=list)
