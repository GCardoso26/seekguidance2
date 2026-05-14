"""Integração produção ↔ governança de replay."""

from __future__ import annotations

from typing import Any

from app.runtime.replay_stability.replay_governance import replay_lineage_stub
from app.runtime.replay_stability.replay_integrity import replay_integrity_stub


def replay_governance_integration_stub(replay_id: str, h_exp: str, h_obs: str) -> dict[str, Any]:
    lineage = replay_lineage_stub(replay_id, parents=[])
    integrity = replay_integrity_stub(h_exp, h_obs)
    return {"lineage": lineage, "integrity": integrity, "production_ready": integrity["ok"]}
