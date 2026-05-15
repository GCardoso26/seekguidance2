"""replay_temporal_history — contrato incremental (sem DB pesado)."""

from __future__ import annotations

from collections.abc import Mapping
from typing import Any

from app.runtime.persistent_replay_runtime.contracts import StorageDialect


def replay_temporal_history_record_stub(
    replay_ref: str,
    *,
    lineage: Mapping[str, Any] | None = None,
    snapshot_id: str | None = None,
) -> dict[str, Any]:
    return {
        "replay_ref": replay_ref,
        "snapshot_id": snapshot_id or f"snap-{replay_ref}",
        "lineage": dict(lineage or {}),
        "assistant_notes": [
            "replay_temporal_history: explainability-first; reasoning_v1…v11 inalterados no núcleo.",
            "Soft normalization apenas; sem equivalência forte cross-TCG.",
        ],
        "legality_reasoning": {"status": "assistant_stub", "layer": "replay_temporal_history"},
        "replay_reasoning": {"deterministic_resume": True, "layer": "replay_temporal_history"},
        "deterministic_alignment": {"token": f"pra-{replay_ref}"},
        "runtime_confidence": 0.72,
        "contradiction_summary": {"count": 0},
        "replay_stability_summary": {"branch_entropy_cap": "governed"},
        "storage_dialect": StorageDialect.SQLITE.value,
    }
