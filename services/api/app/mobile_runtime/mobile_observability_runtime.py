"""Observabilidade leve no dispositivo (stub)."""

from __future__ import annotations

from typing import Any

from app.mobile_runtime._judge_mobile_payload import judge_mobile_core_payload


def mobile_observability_runtime_stub(session_id: str) -> dict[str, Any]:
    return judge_mobile_core_payload(
        replay_summary={"session_id": session_id, "spans": 4, "export": "local_ring_buffer"},
        sync_hints=["Batch de métricas agregadas; sem PII.", "OTEL cloud opcional."],
        deterministic_alignment={"session_anchor": f"obs-{session_id}"},
        mobile_constraints={"max_buffer_kb": 16},
        offline_confidence=0.52,
        assistant_notes=["Diagnósticos móveis complementam live_runtime; não dependem de Grafana."],
        lineage_replay_slice="obs-mobile-v0",
        extras={"mobile_diagnostics": ["sync_latency_p50", "replay_chunk_miss"]},
    )
