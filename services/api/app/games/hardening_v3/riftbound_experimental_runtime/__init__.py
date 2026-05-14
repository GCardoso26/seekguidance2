"""Riftbound — runtime experimental (sem equivalência forte)."""

from __future__ import annotations

from typing import Any

from app.games.hardening_v3.riftbound_unknown_runtime import riftbound_semantic_injection_stub


def riftbound_experimental_runtime_stub(tags: list[str]) -> dict[str, Any]:
    base = riftbound_semantic_injection_stub(tags)
    base["experimental_lane"] = True
    return base
