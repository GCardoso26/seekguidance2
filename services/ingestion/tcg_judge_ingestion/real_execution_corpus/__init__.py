"""Corpus de execução real (lineage + confianças assistentes)."""

from __future__ import annotations

from typing import Any


def real_execution_bundle_stub(replay_id: str) -> dict[str, Any]:
    return {
        "replay_id": replay_id,
        "lineage_temporal": ["snapshot_stub"],
        "replay_refs": [{"replay_id": replay_id, "snapshot_id": "snap_stub"}],
        "publisher_confidence": 0.7,
        "judge_confidence": 0.75,
        "replay_confidence": 0.8,
        "contradiction_confidence": 0.6,
        "ontology_consistency_score": 0.72,
        "semantic_replay_stability": 0.78,
        "replay_integrity_fingerprint": "fp_stub",
        "assistant_notes": ["Judge assistant: expandir com fontes primárias auditadas."],
    }
