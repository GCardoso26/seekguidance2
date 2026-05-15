"""Governança v3 — replay_health_governance"""

from __future__ import annotations

from typing import Any


def replay_health_governance_stub(scope: str) -> dict[str, Any]:
    return {
        "scope": scope,
        "assistant_notes": ["replay_health_governance_stub: explainability-first; federation-ready."],
        "deterministic_alignment": {"token": "da-{scope}"},
        "replay_governance_scores": {"nominal_stub": True},
        "lineage_hints": {},
        "mobile_runtime_hints": {},
    }
