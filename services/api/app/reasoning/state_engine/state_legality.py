"""Validação de legalidade de estado simbólico (bounded, heurística formal)."""

from __future__ import annotations

from typing import Any

from app.reasoning.state_engine.symbolic_state import SymbolicGameState


def validate_state_legality(state: SymbolicGameState, game_slug: str) -> dict[str, Any]:
    illegal: list[str] = []
    if state.flags.get("creature_destroyed") and state.flags.get("creature_alive_same_ref"):
        illegal.append("contradictory_creature_status")
    if state.flags.get("trigger_before_legal_timing"):
        illegal.append("illegal_trigger_insertion_timing")
    if game_slug == "mtg" and state.flags.get("sba_pending") and state.flags.get("replacement_unapplied"):
        illegal.append("invalid_sba_persistence_with_pending_replacement")
    stack = state.zones.get("STACK", frozenset())
    if len(stack) > 24:
        illegal.append("stack_depth_symbolic_overflow")
    zone_consistency = len(illegal) == 0
    timing_legal = not state.flags.get("impossible_chain_window", False)
    return {
        "state_valid": len(illegal) == 0 and timing_legal,
        "illegal_conditions": illegal,
        "timing_legal": timing_legal,
        "zone_consistency": zone_consistency,
    }
