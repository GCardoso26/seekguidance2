"""Runners executáveis para datasets / replay (incremental)."""

from __future__ import annotations

from .alignment_runtime_gate_v3 import alignment_runtime_gate_v3_stub
from .contradiction_detection_runner import contradiction_detection_runner_stub
from .dataset_runtime_gate_bundle import (
    dataset_cross_version_replay_gate_stub,
    dataset_lineage_consistency_gate_stub,
    dataset_mobile_offline_validation_gate_stub,
    dataset_operational_drift_gate_stub,
    dataset_replay_stability_gate_stub,
    dataset_runtime_consistency_gate_stub,
)
from .deterministic_alignment_runner import deterministic_alignment_runner_stub
from .deterministic_replay_validation import deterministic_replay_validation_stub
from .deterministic_runtime_gate_runner import deterministic_runtime_gate_runner_stub
from .deterministic_runtime_validation import deterministic_runtime_validation_stub
from .drift_runtime_gate_v3 import drift_runtime_gate_v3_stub
from .executable_dataset_runtime_runner import executable_dataset_runtime_runner_stub
from .executable_dataset_snapshot_runtime import executable_dataset_snapshot_runtime_stub
from .executable_runtime_gate_engine_v2 import executable_runtime_gate_engine_v2_stub
from .federation_alignment_gate_runner import federation_alignment_gate_runner_stub
from .federation_runtime_gate_runtime import federation_runtime_gate_runtime_stub
from .federation_runtime_gate_v3 import federation_runtime_gate_v3_stub
from .integrity_runtime_gate_v3 import integrity_runtime_gate_v3_stub
from .legality_expectation_runner import legality_expectation_runner_stub
from .legality_runtime_gate_v3 import legality_runtime_gate_v3_stub
from .lineage_regression_gate_runner import lineage_regression_gate_runner_stub
from .mobile_runtime_gate_runner import mobile_runtime_gate_runner_stub
from .mobile_runtime_gate_v3 import mobile_runtime_gate_v3_stub
from .multiplayer_runtime_runner import multiplayer_runtime_runner_stub
from .ontology_drift_runner import ontology_drift_runner_stub
from .operational_runtime_gate_runtime import operational_runtime_gate_runtime_stub
from .operational_runtime_gate_v3 import operational_runtime_gate_v3_stub
from .replacement_runtime_runner import replacement_runtime_runner_stub
from .replay_alignment_execution import replay_alignment_execution_stub
from .replay_alignment_gate import replay_alignment_gate_stub
from .replay_alignment_gate_runner import replay_alignment_gate_runner_stub
from .replay_dataset_ci_runner import replay_dataset_ci_runner_stub
from .replay_drift_gate_runtime import replay_drift_gate_runtime_stub
from .replay_expectation_runner import replay_expectation_runner_stub
from .replay_integrity_gate_runtime import replay_integrity_gate_runtime_stub
from .replay_integrity_runner import replay_integrity_runner_stub
from .replay_legality_gate_runner import replay_legality_gate_runner_stub
from .replay_legality_gate_runtime import replay_legality_gate_runtime_stub
from .replay_runtime_ci_health import replay_runtime_ci_health_stub
from .replay_runtime_gate_v3 import replay_runtime_gate_v3_stub
from .runtime_alignment_gate_runtime import runtime_alignment_gate_runtime_stub
from .runtime_ci_gate_orchestrator_v2 import runtime_ci_gate_orchestrator_v2_stub
from .runtime_ci_gate_runner import runtime_ci_gate_runner_stub
from .runtime_confidence_runner import runtime_confidence_runner_stub
from .runtime_dataset_ci_execution import runtime_dataset_ci_execution_stub
from .runtime_dataset_drift_tracking import runtime_dataset_drift_tracking_stub
from .runtime_dataset_regression_runtime import runtime_dataset_regression_runtime_stub
from .runtime_dataset_regression_tracking import runtime_dataset_regression_tracking_stub
from .runtime_dataset_runner import runtime_dataset_runner_stub
from .runtime_dataset_scoring import runtime_dataset_scoring_stub
from .runtime_dataset_snapshotting import runtime_dataset_snapshotting_stub
from .runtime_drift_gate_runner import runtime_drift_gate_runner_stub
from .runtime_execution_bridge import runtime_execution_bridge_stub
from .runtime_legality_execution import runtime_legality_execution_stub

__all__ = [
    "operational_runtime_gate_v3_stub",
    "alignment_runtime_gate_v3_stub",
    "integrity_runtime_gate_v3_stub",
    "mobile_runtime_gate_v3_stub",
    "federation_runtime_gate_v3_stub",
    "drift_runtime_gate_v3_stub",
    "replay_runtime_gate_v3_stub",
    "legality_runtime_gate_v3_stub",
    "contradiction_detection_runner_stub",
    "dataset_cross_version_replay_gate_stub",
    "dataset_lineage_consistency_gate_stub",
    "dataset_mobile_offline_validation_gate_stub",
    "dataset_operational_drift_gate_stub",
    "dataset_replay_stability_gate_stub",
    "dataset_runtime_consistency_gate_stub",
    "deterministic_alignment_runner_stub",
    "legality_expectation_runner_stub",
    "multiplayer_runtime_runner_stub",
    "ontology_drift_runner_stub",
    "replay_expectation_runner_stub",
    "replay_integrity_runner_stub",
    "replacement_runtime_runner_stub",
    "runtime_confidence_runner_stub",
    "runtime_dataset_runner_stub",
    "deterministic_replay_validation_stub",
    "executable_dataset_runtime_runner_stub",
    "replay_alignment_execution_stub",
    "replay_dataset_ci_runner_stub",
    "runtime_dataset_drift_tracking_stub",
    "runtime_dataset_snapshotting_stub",
    "runtime_execution_bridge_stub",
    "runtime_legality_execution_stub",
    "deterministic_runtime_validation_stub",
    "executable_dataset_snapshot_runtime_stub",
    "replay_alignment_gate_stub",
    "replay_legality_gate_runtime_stub",
    "replay_runtime_ci_health_stub",
    "runtime_dataset_ci_execution_stub",
    "runtime_dataset_regression_tracking_stub",
    "runtime_dataset_scoring_stub",
    "deterministic_runtime_gate_runner_stub",
    "federation_alignment_gate_runner_stub",
    "lineage_regression_gate_runner_stub",
    "mobile_runtime_gate_runner_stub",
    "replay_alignment_gate_runner_stub",
    "replay_legality_gate_runner_stub",
    "runtime_ci_gate_runner_stub",
    "runtime_drift_gate_runner_stub",
    "executable_runtime_gate_engine_v2_stub",
    "federation_runtime_gate_runtime_stub",
    "operational_runtime_gate_runtime_stub",
    "replay_drift_gate_runtime_stub",
    "replay_integrity_gate_runtime_stub",
    "runtime_alignment_gate_runtime_stub",
    "runtime_ci_gate_orchestrator_v2_stub",
    "runtime_dataset_regression_runtime_stub",
]
