"""Diagnósticos de workers."""

from __future__ import annotations

from typing import Any


def worker_runtime_diagnostics_stub(worker_id: str, lag_ms: float) -> dict[str, Any]:
    return {"worker_id": worker_id, "lag_ms": lag_ms, "assistant_notes": ["Worker runtime diagnostics."]}
