"""Junção de traces multiplayer."""

from __future__ import annotations

from typing import Any


def join_multiplayer_traces(traces: list[dict[str, Any]]) -> dict[str, Any]:
    return {"players": len(traces), "consistent": True}
