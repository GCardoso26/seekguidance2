"""Backpressure live."""

from __future__ import annotations

from typing import Any


def runtime_backpressure_live_stub(load: float) -> dict[str, Any]:
    return {"level": "hard" if load > 0.95 else "soft", "assistant_notes": ["Runtime stability."]}
