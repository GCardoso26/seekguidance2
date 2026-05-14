"""Scheduler determinístico: ordenação estável por role + tie-break."""

from __future__ import annotations

from typing import Any


def schedule_roles(roles: list[str], constraints: dict[str, Any]) -> list[str]:
    priority = constraints.get("priority_order") if isinstance(constraints.get("priority_order"), list) else []
    pri_map = {str(r): i for i, r in enumerate(priority)}

    def key(r: str) -> tuple[int, str]:
        return (pri_map.get(r, 999), r)

    return sorted(dict.fromkeys(roles), key=key)
