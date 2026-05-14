"""Pressão FAB — combat chain / reações (soft semantics)."""

from __future__ import annotations

from typing import Any


def combat_chain_pressure(link_count: int, *, soft_cap: int = 12) -> dict[str, Any]:
    return {"pressure": min(1.0, link_count / max(1, soft_cap)), "links": link_count}


def reaction_window_stub(step: str) -> dict[str, Any]:
    return {"step": step, "window_open": step in {"attack", "defense"}}
