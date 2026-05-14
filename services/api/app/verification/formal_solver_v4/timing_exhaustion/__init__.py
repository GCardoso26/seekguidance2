"""Exaustão de timing (stub multi-janela)."""

from __future__ import annotations

from typing import Any


def timing_exhaustion_stub(windows: list[str], cap: int) -> dict[str, Any]:
    return {"exhausted": len(windows) >= cap, "windows": sorted(windows)}
