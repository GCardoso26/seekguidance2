"""Multiplayer reasoning facade (APNAP, simultâneos) — não altera contratos reasoning_v*."""

from app.reasoning.multiplayer.apnap_consistency_validator import validate_apnap_order
from app.reasoning.multiplayer.multiplayer_state_drift import multiplayer_drift_flags
from app.reasoning.multiplayer.shared_resource_conflicts import shared_resource_conflict_flags
from app.reasoning.multiplayer.simultaneous_action_resolution import resolve_simultaneous_actions
from app.reasoning.multiplayer.turn_priority_integrity import turn_priority_ok

__all__ = [
    "multiplayer_drift_flags",
    "resolve_simultaneous_actions",
    "shared_resource_conflict_flags",
    "turn_priority_ok",
    "validate_apnap_order",
]
