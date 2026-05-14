"""Execução de dataset em runtime móvel (stub)."""

from __future__ import annotations

from typing import Any


def mobile_runtime_execution_stub(run_id: str) -> dict[str, Any]:
    return {
        "run_id": run_id,
        "assistant_notes": ["Execução offline de subconjunto; solver pesado opcional na cloud."],
        "replay_summary": {"rows_executed": 80},
        "lineage_snapshot": {"dataset_lineage": run_id},
        "deterministic_alignment": {"token": f"mre-{run_id}"},
    }
