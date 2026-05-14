"""Confiança cross-device (v3 stub)."""

from __future__ import annotations

from typing import Any

from app.mobile_runtime._judge_mobile_payload import judge_mobile_core_payload


def cross_device_trust_runtime_stub(devices: int) -> dict[str, Any]:
    return judge_mobile_core_payload(
        replay_summary={"devices": devices},
        sync_hints=["Quorum de confiança sem PII em claro."],
        deterministic_alignment={"token": "cdt-v3"},
        mobile_constraints={"max_devices": 8},
        offline_confidence=0.55,
        assistant_notes=["Trust score por componente; explainability-first."],
        lineage_replay_slice="cdt-v3",
    )
