"""Limites de divergência semântica."""

from __future__ import annotations

from typing import Any


def semantic_divergence_limits_stub(divergence: float, limit: float) -> dict[str, Any]:
    return {
        "divergence": divergence,
        "limit": limit,
        "within_limit": divergence <= limit,
        "assistant_notes": ["Divergência alta aciona revisão humana / replay diagnostics."],
    }
