"""Judge-grade datasets v4 (manifests executáveis, explainability-first)."""

from __future__ import annotations

from typing import Any

from runtime_ci.runtime_ci_runner import runtime_ci_runner_stub
from runtime_execution.dataset_runtime_gate_bundle import (
    dataset_cross_version_replay_gate_stub,
    dataset_lineage_consistency_gate_stub,
    dataset_mobile_offline_validation_gate_stub,
    dataset_operational_drift_gate_stub,
    dataset_replay_stability_gate_stub,
    dataset_runtime_consistency_gate_stub,
)
from runtime_execution.runtime_dataset_runner import runtime_dataset_runner_stub

from .incremental_dataset_sync import incremental_dataset_sync_stub
from .mobile_dataset_compaction import mobile_dataset_compaction_stub
from .mobile_dataset_compaction_v2 import mobile_dataset_compaction_v2_stub
from .mobile_dataset_delta_sync import mobile_dataset_delta_sync_stub
from .mobile_dataset_governance import mobile_dataset_governance_stub
from .mobile_dataset_integrity import mobile_dataset_integrity_stub
from .mobile_dataset_lineage import mobile_dataset_lineage_stub
from .mobile_dataset_profiles import mobile_dataset_profile_stub
from .mobile_dataset_replay import mobile_dataset_replay_stub
from .mobile_runtime_execution import mobile_runtime_execution_stub
from .offline_dataset_snapshots import offline_dataset_snapshot_stub
from .offline_dataset_validation import offline_dataset_validation_stub
from .runtime_dataset_execution import runtime_dataset_execution_stub


def v4_dataset_gate_bundle_stub(run_id: str) -> dict[str, Any]:
    return {
        "run_id": run_id,
        "gates": {
            "replay_stability": dataset_replay_stability_gate_stub(run_id),
            "runtime_consistency": dataset_runtime_consistency_gate_stub(run_id),
            "lineage": dataset_lineage_consistency_gate_stub(run_id),
            "mobile_offline": dataset_mobile_offline_validation_gate_stub(run_id),
            "drift": dataset_operational_drift_gate_stub(run_id),
            "cross_version": dataset_cross_version_replay_gate_stub(run_id),
        },
        "assistant_notes": ["Judge-grade v4: gates operacionais sem motor jurídico automático."],
    }


def v4_dataset_stub(kind: str) -> dict[str, Any]:
    return {
        "kind": kind,
        "version": "v4-stub",
        "replay_refs": [],
        "legality_expectations": [],
        "timing_expectations": [],
        "deterministic_expectations": {},
        "contradiction_expectations": [],
        "solver_expectations": [],
        "ontology_drift_metadata": {},
        "replay_lineage_metadata": {},
        "branch_divergence_metadata": {},
        "assistant_notes": [f"Dataset v4 {kind}: preparar corpus real com governança de replay."],
    }


__all__ = [
    "dataset_cross_version_replay_gate_stub",
    "dataset_lineage_consistency_gate_stub",
    "dataset_mobile_offline_validation_gate_stub",
    "dataset_operational_drift_gate_stub",
    "dataset_replay_stability_gate_stub",
    "dataset_runtime_consistency_gate_stub",
    "incremental_dataset_sync_stub",
    "mobile_dataset_compaction_stub",
    "mobile_dataset_compaction_v2_stub",
    "mobile_dataset_delta_sync_stub",
    "mobile_dataset_governance_stub",
    "mobile_dataset_integrity_stub",
    "mobile_dataset_lineage_stub",
    "mobile_dataset_profile_stub",
    "mobile_dataset_replay_stub",
    "mobile_runtime_execution_stub",
    "offline_dataset_snapshot_stub",
    "offline_dataset_validation_stub",
    "runtime_dataset_execution_stub",
    "runtime_ci_runner_stub",
    "runtime_dataset_runner_stub",
    "v4_dataset_gate_bundle_stub",
    "v4_dataset_stub",
]
