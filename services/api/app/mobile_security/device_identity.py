"""Identidade de dispositivo (binding não PII) — stub."""

from __future__ import annotations

from typing import Any

from app.mobile_runtime._judge_mobile_payload import judge_mobile_core_payload


def device_identity_stub(device_salt: str) -> dict[str, Any]:
    return judge_mobile_core_payload(
        replay_summary={"device_salt": device_salt, "binding": "ephemeral-v0"},
        sync_hints=["Rotacionar salt após logout.", "Nunca enviar identificadores brutos em claro."],
        deterministic_alignment={"device_token": f"dev-{device_salt}"},
        mobile_constraints={"store_secure_enclave": True},
        offline_confidence=0.75,
        assistant_notes=["Identidade operacional para fila de sync; juiz humano não é identificado."],
        lineage_replay_slice="device-id-v0",
        extras={"trust_operational": True, "tamper_surface": "low"},
    )
