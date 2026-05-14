"""Resolução de conflitos offline→online v2 (stub)."""

from __future__ import annotations

from typing import Any

from app.offline_runtime._offline_payload import offline_judge_payload


def offline_conflict_resolution_v2_stub(conflicts: int) -> dict[str, Any]:
    return offline_judge_payload(
        replay_summary={"conflicts": conflicts, "strategy": "judge_assisted_v2"},
        sync_hints=["Expor prova mínima + diff de eventos."],
        deterministic_alignment={"policy": "ocr2-v0"},
        mobile_constraints={"max_payload_kb": 72},
        offline_confidence=0.48,
        assistant_notes=["v2: separa metadados mergeáveis de ruling humano."],
        lineage_replay_slice="ocr2-v0",
        offline_limitations=["Sem visão global de mesa física"],
        sync_conflicts=[{"id": i, "severity": "review"} for i in range(min(conflicts, 2))],
        replay_alignment={"three_way": True},
        extras={
            "sync_confidence": max(0.2, 0.9 - 0.1 * conflicts),
            "replay_delta_summary": {"conflict_ops": conflicts},
            "conflict_resolution_notes": ["Juiz confirma ruling final"],
            "deterministic_merge_hints": ["non_ruling_metadata_only_auto"],
        },
    )
