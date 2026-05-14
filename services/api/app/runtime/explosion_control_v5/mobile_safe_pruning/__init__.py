"""Pruning seguro para dispositivos (extensão incremental de explosion_control_v5)."""

from __future__ import annotations

from typing import Any


def mobile_safe_pruning_stub(width: int, device_mem_mb: int) -> dict[str, Any]:
    cap = 8 if device_mem_mb < 4096 else 16
    return {
        "width": width,
        "cap": cap,
        "assistant_notes": ["Caps móveis sem alterar pipelines V1–V11 no servidor."],
    }
