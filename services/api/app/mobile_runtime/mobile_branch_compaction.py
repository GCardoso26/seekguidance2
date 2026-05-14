"""Compactação agressiva de ramos para memória móvel (stub)."""

from __future__ import annotations

from typing import Any

from app.mobile_runtime._judge_mobile_payload import judge_mobile_core_payload


def mobile_branch_compaction_stub(width: int, cap: int) -> dict[str, Any]:
    pruned = max(0, width - cap)
    return judge_mobile_core_payload(
        replay_summary={"width": width, "cap": cap, "pruned_branches": pruned},
        sync_hints=["Persistir apenas heads de ramo para resume determinístico."],
        deterministic_alignment={"compaction_id": "mbc-v0", "order_preserved": True},
        mobile_constraints={"memory_class": "phone", "entropy_soft_cap": 0.35},
        offline_confidence=0.7,
        assistant_notes=[
            "Pruning móvel não altera contratos explosion_control_v5 no núcleo.",
        ],
        lineage_replay_slice="branch-compaction-v0",
    )
