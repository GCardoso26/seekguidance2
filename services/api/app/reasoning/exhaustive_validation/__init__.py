"""Exhaustive validation package (bounded; não substitui motores V3–V11)."""

from app.reasoning.exhaustive_validation.exploration import apnap_window_stub, bounded_timing_orders, segoc_pairing_stub
from app.reasoning.exhaustive_validation.replacement_propagation import (
    bounded_replacement_propagation,
    replacement_loop_legality,
)
from app.reasoning.exhaustive_validation.sba_triggers import (
    exhaustive_sba_ordering_stub,
    exhaustive_trigger_ordering,
    simultaneous_multiplayer_stub,
)

__all__ = [
    "apnap_window_stub",
    "bounded_replacement_propagation",
    "bounded_timing_orders",
    "exhaustive_sba_ordering_stub",
    "exhaustive_trigger_ordering",
    "replacement_loop_legality",
    "segoc_pairing_stub",
    "simultaneous_multiplayer_stub",
]
