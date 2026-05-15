"""Readiness móvel/offline (validação leve, explainability-first)."""

from __future__ import annotations

from typing import Any

from app.contracts.mobile_runtime_contracts import MobileReadinessSignals
from app.mobile_runtime.runtime_sync_v2 import replay_sync_health_v3_stub


def mobile_runtime_readiness_stub(device_id: str) -> dict[str, Any]:
    sync = replay_sync_health_v3_stub(device_id)
    signals = MobileReadinessSignals(
        device_id=device_id,
        sync_queue_depth_hint=0,
        offline_drift_bounded=True,
        compact_transport_ok=True,
        replay_conflict_score=0.0,
    )
    return {
        "readiness": signals.model_dump(),
        "sync_raw": sync,
        "assistant_notes": [
            "mobile_runtime_readiness: agrega sync/lineage/drift sem juízo automático.",
        ],
    }
