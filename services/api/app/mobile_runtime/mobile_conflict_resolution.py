"""Resolução assistida de conflitos sync (stub)."""

from __future__ import annotations

from typing import Any

from app.mobile_runtime._judge_mobile_payload import judge_mobile_core_payload


def mobile_conflict_resolution_stub(conflicts: int) -> dict[str, Any]:
    return judge_mobile_core_payload(
        replay_summary={"open_conflicts": conflicts, "strategy": "judge_assisted"},
        sync_hints=["Expor diff de replay lado a lado no UI móvel."],
        deterministic_alignment={"tie_break": "server_wins_non_ruling_metadata_only"},
        mobile_constraints={"max_conflict_payload_kb": 48},
        offline_confidence=0.5,
        assistant_notes=[
            "Rulings sensíveis: sempre confirmação humana; sem merge automático.",
        ],
        lineage_replay_slice="conflict-v0",
        extras={"sync_conflicts_preview": conflicts},
    )
