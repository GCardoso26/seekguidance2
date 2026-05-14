"""Engine de datasets executáveis (legalidade, timing, replay)."""

from __future__ import annotations

from typing import Any


def executable_case_bundle_stub(case_type: str) -> dict[str, Any]:
    return {
        "case_type": case_type,
        "replay_refs": [{"replay_id": "stub", "snapshot_id": "stub"}],
        "legality_expectations": [],
        "timing_expectations": [],
        "deterministic_expectations": {"tolerance": "bounded"},
        "contradiction_expectations": [],
        "solver_expectations": [],
        "assistant_notes": ["Casos são assistentes; juiz valida premissas e política temporal."],
    }
