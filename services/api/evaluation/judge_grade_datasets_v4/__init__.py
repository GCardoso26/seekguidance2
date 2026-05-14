"""Judge-grade datasets v4 (manifests executáveis, explainability-first)."""

from __future__ import annotations

from typing import Any


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
