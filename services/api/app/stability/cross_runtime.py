"""Estabilidade cross-version e cross-TCG (guardas de regressão leves)."""

from __future__ import annotations

from typing import Any

from app.runtime.replay.replay_hashing import deterministic_hash


def cross_version_replay_stability(prev_payload: dict[str, Any], curr_payload: dict[str, Any]) -> dict[str, Any]:
    return {"stable_hash": deterministic_hash(prev_payload) == deterministic_hash(curr_payload)}


def cross_tcg_reasoning_stability(game_a: str, game_b: str) -> dict[str, Any]:
    """Soft isolation: nunca força equivalência mecânica."""
    return {"isolation": "soft_normalization", "game_a": game_a, "game_b": game_b, "shared_engine": True}


def ontology_migration_safety_stub(prev_nodes: int, curr_nodes: int) -> dict[str, Any]:
    growth = curr_nodes - prev_nodes
    return {"safe": growth <= max(50, prev_nodes // 10), "growth": growth}
