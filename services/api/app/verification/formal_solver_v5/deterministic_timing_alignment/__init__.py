"""Alinhamento determinístico de timing."""

from __future__ import annotations

from typing import Any


def deterministic_timing_alignment_payload(events: list[str]) -> dict[str, Any]:
    return {
        "events": events,
        "legality_reasoning": ["Ordem canónica dentro do replay determinístico."],
        "proof_steps": [{"step": i + 1, "event": e} for i, e in enumerate(events[:4])],
        "assistant_notes": ["Simultaneous timing: explicar trade-offs por TCG."],
        "timing_certificate": True,
    }
