"""Observabilidade do edge (stub leve)."""

from __future__ import annotations

from typing import Any

from app.mobile_runtime._judge_mobile_payload import judge_mobile_core_payload


def edge_runtime_observability_stub(session: str) -> dict[str, Any]:
    return judge_mobile_core_payload(
        replay_summary={"session": session, "spans": 3},
        sync_hints=["Export batch 30s; sem PII."],
        deterministic_alignment={"obs_token": f"ero-{session}"},
        mobile_constraints={"buffer_kb": 12},
        offline_confidence=0.51,
        assistant_notes=["OTEL/Prometheus permanecem opcionais na cloud."],
        lineage_replay_slice="ero-v0",
        extras={
            "edge_constraints": {"sampling_hz": 10},
            "replay_compaction": {"aggregate_only": True},
            "deterministic_limits": {"stable_span_ids": True},
            "sync_expectations": ["upload_telemetry_when_online"],
        },
    )
