"""Validação ligada a replay."""

from __future__ import annotations

from typing import Any


def replay_consistency_tracking_stub(replay_id: str, hash_expected: str, hash_observed: str) -> dict[str, Any]:
    return {
        "replay_id": replay_id,
        "consistent": hash_expected == hash_observed,
        "drift_score": 0.0 if hash_expected == hash_observed else 0.5,
    }
