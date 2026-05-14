"""Loops de replacement (orientação de mesa)."""

from __future__ import annotations


def replacement_loop_hint(depth: int, *, cap: int = 8) -> dict[str, object]:
    return {
        "risk": depth > cap,
        "assistant_guidance": "Sugira verificar limite de repetições e estado após cada resolução.",
        "depth": depth,
    }
