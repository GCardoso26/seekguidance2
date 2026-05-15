"""replay_state_mismatch_runtime"""

from __future__ import annotations

from typing import Any


def replay_state_mismatch_runtime_stub(scope: str) -> dict[str, Any]:
    return {
        "scope": scope,
        "assistant_notes": ["replay_state_mismatch_runtime_stub: estabilidade v2; explainability-first."],
        "deterministic_alignment": {"token": f"v2-{scope}"},
        "runtime_confidence": 0.79,

        "replay_drift_score": 0.11,
        "replay_divergence_summary": {},
        "determinism_confidence": 0.8,
        "replay_mismatch_summary": {},
        "branch_instability_score": 0.09,
    }
