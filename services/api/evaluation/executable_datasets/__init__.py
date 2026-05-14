"""Engine de datasets executáveis (legalidade, timing, replay)."""

from __future__ import annotations

from typing import Any

from .dataset_drift_runtime import dataset_drift_runtime_stub
from .dataset_lineage_runtime import dataset_lineage_runtime_stub
from .dataset_reconciliation import dataset_reconciliation_stub
from .dataset_replay_governance import dataset_replay_governance_stub
from .dataset_runtime_calibration import dataset_runtime_calibration_stub
from .dataset_runtime_compaction import dataset_runtime_compaction_stub
from .dataset_runtime_regressions import dataset_runtime_regressions_stub
from .dataset_temporal_alignment import dataset_temporal_alignment_stub
from .replay_dataset_execution import replay_dataset_execution_stub
from .runtime_dataset_execution import runtime_dataset_execution_stub


def executable_case_bundle_stub(case_type: str) -> dict[str, Any]:
    return {
        "case_type": case_type,
        "replay_refs": [{"replay_id": "stub", "snapshot_id": "stub"}],
        "legality_expectations": [],
        "timing_expectations": [],
        "deterministic_expectations": {"tolerance": "bounded"},
        "contradiction_expectations": [],
        "solver_expectations": [],
        "assistant_notes": ["Casos são assistentes; juiz valida premissas e política temporal."],
    }


__all__ = [
    "dataset_drift_runtime_stub",
    "dataset_lineage_runtime_stub",
    "dataset_reconciliation_stub",
    "dataset_replay_governance_stub",
    "dataset_runtime_calibration_stub",
    "dataset_runtime_compaction_stub",
    "dataset_runtime_regressions_stub",
    "dataset_temporal_alignment_stub",
    "executable_case_bundle_stub",
    "replay_dataset_execution_stub",
    "runtime_dataset_execution_stub",
]
