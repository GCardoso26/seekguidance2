"""runtime_drift_ci — CI judge-grade (stub v8)."""

from __future__ import annotations

from typing import Any


def runtime_drift_ci_v8_stub(build_id: str) -> dict[str, Any]:
    return {
        "build_id": build_id,
        "assistant_notes": ["CI replay-aware; sem relaxar determinismo."],
        "replay_stability": "tracked",
        "cross_tcg_safe": True,
    }
