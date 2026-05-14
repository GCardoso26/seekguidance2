"""Reasoning offline simplificado (stub)."""

from __future__ import annotations

from typing import Any

from app.offline_runtime._offline_payload import offline_judge_payload


def offline_reasoning_stub(case_id: str) -> dict[str, Any]:
    return offline_judge_payload(
        replay_summary={"case_id": case_id, "mode": "offline-hints"},
        sync_hints=["Sincronizar ruling_cache quando online."],
        deterministic_alignment={"token": f"orf-{case_id}"},
        mobile_constraints={"depth_cap": 4},
        offline_confidence=0.48,
        assistant_notes=["Sem solver pesado; apenas heurísticas explicáveis."],
        lineage_replay_slice=f"orf-{case_id}",
        offline_limitations=["Sem acesso a datasets massivos", "Sem merge automático de ruling"],
        sync_conflicts=[],
        replay_alignment={"status": "local_only"},
    )
