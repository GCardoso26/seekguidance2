"""Reconciliação temporal de replay."""

from __future__ import annotations

from typing import Any


def temporal_replay_reconciliation_stub(ticks: list[int]) -> dict[str, Any]:
    return {"monotonic": ticks == sorted(ticks), "assistant_notes": ["Temporal replay reconciliation."]}
