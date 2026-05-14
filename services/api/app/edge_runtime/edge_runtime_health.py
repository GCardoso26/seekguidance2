"""Saúde do edge runtime (stub)."""

from __future__ import annotations

from typing import Any

from app.mobile_runtime._judge_mobile_payload import judge_mobile_core_payload


def edge_runtime_health_stub(ok: bool) -> dict[str, Any]:
    return judge_mobile_core_payload(
        replay_summary={"healthy": ok},
        sync_hints=["Se unhealthy, forçar modo replay read-only."],
        deterministic_alignment={"health": "green" if ok else "amber"},
        mobile_constraints={"fail_safe": True},
        offline_confidence=0.74 if ok else 0.4,
        assistant_notes=["Health local complementa mobile_runtime_health_v2 observability."],
        lineage_replay_slice="erh-v0",
        extras={
            "edge_constraints": {"checks": ["storage", "journal", "clock"]},
            "replay_compaction": {"disabled_when_unhealthy": True},
            "deterministic_limits": {"read_only_heads": not ok},
            "sync_expectations": ["minimal_ping_only_when_unhealthy"],
        },
    )
