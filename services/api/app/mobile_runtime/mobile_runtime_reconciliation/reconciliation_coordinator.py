"""Reconciliação runtime móvel (stub)."""

from __future__ import annotations

from typing import Any


def mobile_runtime_reconciliation_coordinator_stub(device_id: str) -> dict[str, Any]:
    return {
        "device_id": device_id,
        "replay_confidence": 0.82,
        "reconciliation_notes": ["mobile_runtime_reconciliation: determinístico; soft normalization."],
        "reconciliation_summary": {"open_conflicts": 0},
        "assistant_notes": [
            "mobile_runtime_reconciliation: determinístico; soft normalization.",
        ],
    }


mobile_runtime_reconciliation_stub = mobile_runtime_reconciliation_coordinator_stub
