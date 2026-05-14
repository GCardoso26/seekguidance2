"""FAB — janela de reação (instabilidade de timing, soft)."""

from __future__ import annotations

from typing import Any


def fab_reaction_window_instability_stub(open_windows: int) -> dict[str, Any]:
    return {
        "open_windows": open_windows,
        "timing_instability": open_windows > 5,
        "assistant_notes": ["Soft normalization: não equiparar a stack genérico."],
    }
