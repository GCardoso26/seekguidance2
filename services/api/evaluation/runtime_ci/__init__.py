"""Runtime CI — gates operacionais sobre runtime_execution (incremental)."""
from __future__ import annotations

from .deterministic_alignment_gate import deterministic_alignment_gate_stub
from .multiplayer_runtime_gate import multiplayer_runtime_gate_stub
from .ontology_drift_gate import ontology_drift_gate_stub
from .replacement_runtime_gate import replacement_runtime_gate_stub
from .replay_integrity_gate import replay_integrity_gate_stub
from .replay_stability_gate import replay_stability_gate_stub
from .runtime_ci_gates import runtime_ci_gates_stub
from .runtime_ci_runner import runtime_ci_runner_stub
from .runtime_confidence_gate import runtime_confidence_gate_stub
from .runtime_regression_gate import runtime_regression_gate_stub

__all__ = [
    "runtime_ci_runner_stub",
    "runtime_ci_gates_stub",
    "replay_stability_gate_stub",
    "deterministic_alignment_gate_stub",
    "ontology_drift_gate_stub",
    "replay_integrity_gate_stub",
    "multiplayer_runtime_gate_stub",
    "replacement_runtime_gate_stub",
    "runtime_confidence_gate_stub",
    "runtime_regression_gate_stub",
]
