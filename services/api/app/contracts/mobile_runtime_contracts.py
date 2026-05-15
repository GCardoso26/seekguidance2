"""Contratos mobile runtime (readiness / sync)."""

from __future__ import annotations

from pydantic import BaseModel, Field


class MobileReadinessSignals(BaseModel):
    """Sinais agregados para readiness offline/híbrido."""

    model_config = {"extra": "forbid"}

    device_id: str = Field(min_length=1, max_length=256)
    sync_queue_depth_hint: int = Field(ge=0, default=0)
    offline_drift_bounded: bool = True
    compact_transport_ok: bool = True
    replay_conflict_score: float = Field(ge=0.0, le=1.0, default=0.0)
