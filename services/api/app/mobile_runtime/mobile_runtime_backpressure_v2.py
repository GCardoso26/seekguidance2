"""Backpressure v2 do runtime móvel (stub)."""

from __future__ import annotations

from typing import Any

from app.mobile_runtime._judge_mobile_payload import judge_mobile_core_payload


def mobile_runtime_backpressure_v2_stub(pressure: float) -> dict[str, Any]:
    return judge_mobile_core_payload(
        replay_summary={"pressure": pressure},
        sync_hints=["Coalescer deltas quando pressure>0.8."],
        deterministic_alignment={"token": "mrb2"},
        mobile_constraints={"throttle": pressure > 0.75},
        offline_confidence=0.49 if pressure > 0.75 else 0.7,
        assistant_notes=["v2: separa fila replay vs telemetria."],
        lineage_replay_slice="mrb2",
    )
