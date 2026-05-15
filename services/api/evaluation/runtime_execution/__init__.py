"""Runners executáveis para datasets / replay (incremental)."""

from __future__ import annotations

from .contradiction_detection_runner import contradiction_detection_runner_stub
from .deterministic_alignment_runner import deterministic_alignment_runner_stub
from .legality_expectation_runner import legality_expectation_runner_stub
from .multiplayer_runtime_runner import multiplayer_runtime_runner_stub
from .ontology_drift_runner import ontology_drift_runner_stub
from .replacement_runtime_runner import replacement_runtime_runner_stub
from .replay_expectation_runner import replay_expectation_runner_stub
from .replay_integrity_runner import replay_integrity_runner_stub
from .runtime_confidence_runner import runtime_confidence_runner_stub
from .runtime_dataset_runner import runtime_dataset_runner_stub

__all__ = [
    "contradiction_detection_runner_stub",
    "deterministic_alignment_runner_stub",
    "legality_expectation_runner_stub",
    "multiplayer_runtime_runner_stub",
    "ontology_drift_runner_stub",
    "replay_expectation_runner_stub",
    "replay_integrity_runner_stub",
    "replacement_runtime_runner_stub",
    "runtime_confidence_runner_stub",
    "runtime_dataset_runner_stub",
]
