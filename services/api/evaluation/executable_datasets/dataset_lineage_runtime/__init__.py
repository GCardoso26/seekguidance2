"""dataset_lineage_runtime — pipeline executável (stub)."""

from __future__ import annotations

from typing import Any


def dataset_lineage_runtime_stub(case_id: str) -> dict[str, Any]:
    return {
        "case_id": case_id,
        "assistant_notes": ["Dataset executável vivo; replay-first; juiz valida."],
        "replay_summary": {"layer": "dataset_lineage_runtime"},
        "lineage_runtime": {"stub": True},
        "deterministic_ci": True,
    }
