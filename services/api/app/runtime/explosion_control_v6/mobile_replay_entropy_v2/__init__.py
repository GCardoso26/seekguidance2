"""Entropia de replay no dispositivo (explosion_control v6 — stub)."""

from __future__ import annotations

from typing import Any


def mobile_replay_entropy_v2_stub(entropy: float) -> dict[str, Any]:
    return {
        "entropy": entropy,
        "cap": 0.35,
        "assistant_notes": ["v6: caps móveis evoluem sem alterar contratos v5 existentes."],
        "replay_summary": {"clamped": entropy > 0.35},
        "deterministic_alignment": {"stable_ordering": True},
    }
