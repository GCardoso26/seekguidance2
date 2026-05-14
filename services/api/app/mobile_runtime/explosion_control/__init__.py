"""Controlo de explosão adaptado a memória/bateria móvel."""

from __future__ import annotations

from typing import Any


def mobile_explosion_caps_stub(max_width: int, cap: int) -> dict[str, Any]:
    return {
        "max_width": max_width,
        "cap": cap,
        "pruned": max(0, max_width - cap),
        "assistant_notes": ["Pruning agressivo no mobile; soft normalization mantida."],
    }
