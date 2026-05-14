"""Reasoning limitado no edge (hints; núcleo reasoning_v* inalterado no servidor)."""

from __future__ import annotations

from typing import Any

from app.mobile_runtime._judge_mobile_payload import judge_mobile_core_payload


def edge_reasoning_runtime_stub(case_id: str) -> dict[str, Any]:
    return judge_mobile_core_payload(
        replay_summary={"case_id": case_id, "mode": "edge-hints"},
        sync_hints=["Opcional: pedir refinamento cloud sem bloquear UX local."],
        deterministic_alignment={"token": f"err-{case_id}"},
        mobile_constraints={"latency_budget_ms": 40},
        offline_confidence=0.56,
        assistant_notes=["Edge não substitui pipelines V1–V11 no servidor."],
        lineage_replay_slice=f"edge-reason-{case_id}",
        extras={
            "edge_constraints": {"mem_mb_soft": 256, "cpu_ms_per_tick": 10},
            "replay_compaction": {"max_events": 48},
            "deterministic_limits": {"branch_depth_cap": 5},
            "sync_expectations": ["delta_semantic_when_online"],
        },
    )
