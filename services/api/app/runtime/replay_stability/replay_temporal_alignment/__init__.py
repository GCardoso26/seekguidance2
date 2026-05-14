"""Alinhamento temporal de replay."""

from __future__ import annotations

from typing import Any


def replay_temporal_alignment_stub(ticks: list[int]) -> dict[str, Any]:
    mono = all(ticks[i] <= ticks[i + 1] for i in range(len(ticks) - 1)) if len(ticks) > 1 else True
    return {"monotonic": mono}
