"""Controlos de custo/bateria no dispositivo (stub)."""

from __future__ import annotations

from typing import Any

from app.mobile_runtime._judge_mobile_payload import judge_mobile_core_payload


def mobile_cost_controls_stub(battery_pct: int) -> dict[str, Any]:
    throttle = battery_pct < 20
    return judge_mobile_core_payload(
        replay_summary={"battery_pct": battery_pct, "throttle": throttle},
        sync_hints=["Reduzir FPS de timeline em modo baixa bateria.", "Adiar sync não crítico."],
        deterministic_alignment={"cost_policy": "battery-aware-v0"},
        mobile_constraints={"max_cpu_ms_per_tick": 12 if throttle else 24},
        offline_confidence=0.57,
        assistant_notes=["Throttling preserva determinismo por tick; não altera ordem lógica salva."],
        lineage_replay_slice="cost-ctrl-v0",
    )
