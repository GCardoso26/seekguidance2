"""Scheduler do runtime móvel (stub)."""

from __future__ import annotations

from typing import Any

from app.mobile_runtime._judge_mobile_payload import judge_mobile_core_payload


def mobile_runtime_scheduler_stub(queue: int) -> dict[str, Any]:
    return judge_mobile_core_payload(
        replay_summary={"queue_depth": queue},
        sync_hints=["Priorizar replay antes de analytics."],
        deterministic_alignment={"token": "mrs"},
        mobile_constraints={"fairness": "round_robin"},
        offline_confidence=0.61,
        assistant_notes=["Scheduler explicável; juiz pode inspecionar próximas tarefas."],
        lineage_replay_slice="mrs",
    )
