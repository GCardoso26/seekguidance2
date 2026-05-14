"""Contexto ao vivo de partida (stub operacional)."""

from __future__ import annotations

from typing import Any


def build_live_match_context(*, round_no: int, match_id: str) -> dict[str, Any]:
    return {"round": round_no, "match_id": match_id, "phase": "active_turn"}
