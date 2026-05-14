"""Lorcana — progressão de lore (soft)."""

from __future__ import annotations

from typing import Any


def lorcana_lore_progression_runtime_stub(lore_steps: int) -> dict[str, Any]:
    return {
        "lore_steps": lore_steps,
        "normalization_leak_risk": lore_steps > 12,
        "assistant_notes": ["Progressão local; não forçar equivalência com outros TCGs."],
    }
