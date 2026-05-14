"""Compactação de ramos offline (stub)."""

from __future__ import annotations

from typing import Any

from app.offline_runtime._offline_payload import offline_judge_payload


def offline_branch_compaction_stub(width: int, cap: int) -> dict[str, Any]:
    return offline_judge_payload(
        replay_summary={"width": width, "cap": cap, "pruned": max(0, width - cap)},
        sync_hints=["Persistir apenas checkpoints de resume."],
        deterministic_alignment={"compaction": "offline-v0"},
        mobile_constraints={"mem_soft_mb": 384},
        offline_confidence=0.67,
        assistant_notes=["Compatível com explosion_control_v5 mobile-safe."],
        lineage_replay_slice="obc-v0",
        offline_limitations=["Exploração profunda truncada"],
        sync_conflicts=[],
        replay_alignment={"pruned_heads": max(0, width - cap)},
    )
