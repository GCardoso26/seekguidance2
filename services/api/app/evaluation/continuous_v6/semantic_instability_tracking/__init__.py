"""Instabilidade semântica ao longo do tempo."""

from __future__ import annotations

from typing import Any


def semantic_instability_tracking_stub(flags: list[bool]) -> dict[str, Any]:
    return {"unstable_ratio": sum(flags) / len(flags) if flags else 0.0}
