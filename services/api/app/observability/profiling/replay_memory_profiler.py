"""Profiler de memória lógica de replay (amplification proxy)."""

from __future__ import annotations

from typing import Any


def replay_memory_pressure(events: int, unique_hashes: int) -> dict[str, Any]:
    amp = events / max(1, unique_hashes)
    return {"events": events, "unique_hashes": unique_hashes, "amplification": round(amp, 4)}
