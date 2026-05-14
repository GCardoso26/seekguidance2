"""Explosão de ramos em live."""

from __future__ import annotations

from typing import Any


def branch_explosion_live_stub(width: int, threshold: int) -> dict[str, Any]:
    return {
        "width": width,
        "threshold": threshold,
        "hot": width > threshold,
        "assistant_notes": ["Acoplar a explosion_control_v4 para caps dinâmicos."],
    }
