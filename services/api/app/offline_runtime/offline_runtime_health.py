"""Saúde do runtime offline (stub)."""

from __future__ import annotations

from typing import Any

from app.offline_runtime._offline_payload import offline_judge_payload


def offline_runtime_health_stub(ok: bool) -> dict[str, Any]:
    return offline_judge_payload(
        replay_summary={"healthy": ok, "checks": ["storage", "replay_head", "cache"]},
        sync_hints=["Se unhealthy, degradar UX e pedir sync mínimo."],
        deterministic_alignment={"health_token": "ok" if ok else "degraded"},
        mobile_constraints={"fail_safe": True},
        offline_confidence=0.7 if ok else 0.35,
        assistant_notes=["Saúde local não substitui alertas operacionais centralizados."],
        lineage_replay_slice="health-v0",
        offline_limitations=["Sem visão cluster"],
        sync_conflicts=[],
        replay_alignment={"status": "green" if ok else "amber"},
    )
