"""replay_dataset_execution — pipeline executável (stub)."""

from __future__ import annotations

from typing import Any


def replay_dataset_execution_stub(case_id: str) -> dict[str, Any]:
    return {
        "case_id": case_id,
        "assistant_notes": ["Dataset executável vivo; replay-first; juiz valida."],
        "replay_summary": {"layer": "replay_dataset_execution"},
        "lineage_runtime": {"stub": True},
        "deterministic_ci": True,
    }
