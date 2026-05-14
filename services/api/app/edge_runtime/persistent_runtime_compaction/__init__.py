"""persistent_runtime_compaction — persistência operacional (stub v2)."""

from __future__ import annotations

from typing import Any

from app.mobile_runtime._judge_mobile_payload import (
    attach_persistent_operational_fields,
    judge_mobile_core_payload,
)


def persistent_runtime_compaction_stub(rid: str) -> dict[str, Any]:
    base = judge_mobile_core_payload(
        replay_summary={"layer": "persistent_runtime_compaction", "runtime": "edge_runtime", "rid": rid},
        sync_hints=["Checkpoint antes de merge; replay-first."],
        deterministic_alignment={"token": "e-persistent_runtime_compaction"},
        mobile_constraints={"durable_journal": True},
        offline_confidence=0.65,
        assistant_notes=[
            "Persistência híbrida incremental; explainability-first.",
            "Pipelines V1–V11 e reasoning_v* permanecem no núcleo servidor.",
        ],
        lineage_replay_slice=f"e-{rid}",
    )
    return attach_persistent_operational_fields(
        base,
        persistent_status={"wal": True, "pkg": "persistent_runtime_compaction"},
        storage_recovery={"checkpoint": "ok"},
        replay_reconciliation={"queue_depth": 0},
        lineage_persistence={"anchors": 1, "slice": rid},
        deterministic_recovery_alignment={"resume": "det-e"},
    )
