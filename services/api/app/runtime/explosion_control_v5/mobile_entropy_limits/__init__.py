"""Limites de entropia específicos para dispositivos móveis (stub)."""

from __future__ import annotations

from typing import Any


def mobile_entropy_limits_stub(entropy: float, mem_mb: int) -> dict[str, Any]:
    cap = 0.25 if mem_mb < 3072 else 0.4
    return {
        "entropy": entropy,
        "cap": cap,
        "clamped": entropy > cap,
        "assistant_notes": [
            "Caps móveis; núcleo explosion_control_v5 inalterado.",
            "Explainability-first: mostrar entropia e cap ao juiz.",
        ],
        "replay_summary": {"branch_entropy": entropy, "device_mem_mb": mem_mb},
        "sync_hints": ["Sincronizar caps com servidor quando online."],
        "deterministic_alignment": {"ordering": "stable", "token": "mel-v0"},
        "mobile_constraints": {"mem_mb": mem_mb},
        "offline_confidence": 0.66,
        "lineage_replay_awareness": {"slice": "entropy-mobile-v0"},
    }
