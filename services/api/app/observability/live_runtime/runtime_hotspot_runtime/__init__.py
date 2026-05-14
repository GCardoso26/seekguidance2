"""Hotspots de runtime (live)."""

from __future__ import annotations

from typing import Any


def runtime_hotspot_runtime_stub(hot: int) -> dict[str, Any]:
    return {"hotspots": hot, "assistant_notes": ["Hotspots para scaling e backpressure."]}
