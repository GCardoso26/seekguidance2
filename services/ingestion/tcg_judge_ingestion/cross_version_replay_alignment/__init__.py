"""Alinhamento de replay cross-version."""

from __future__ import annotations

from typing import Any


def cross_version_replay_alignment_stub(v_old: str, v_new: str) -> dict[str, Any]:
    return {
        "from": v_old,
        "to": v_new,
        "temporal_alignment_score": 0.9,
        "cross_version_legality_drift": 0.05,
        "assistant_notes": ["Soft normalization: drift medido, não colapsado."],
    }
