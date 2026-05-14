"""Judge-grade datasets v3 (registry stubs)."""

from __future__ import annotations

from typing import Any


def v3_dataset_stub(kind: str) -> dict[str, Any]:
    return {
        "kind": kind,
        "replay_refs": [],
        "legality_expectations": [],
        "timing_expectations": [],
        "deterministic_expectations": {},
        "contradiction_expectations": [],
        "solver_expectations": [],
        "assistant_notes": [f"Dataset v3 {kind}: expandir com corpus executável real."],
        "replay_snapshots": [],
        "ontology_drift_metadata": {},
        "branch_divergence_metadata": {},
    }
