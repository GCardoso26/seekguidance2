"""Monitorização de consistência de replay."""

from __future__ import annotations

from typing import Any


def replay_consistency_monitoring_stub(run_a_hash: str, run_b_hash: str) -> dict[str, Any]:
    return {
        "run_a_hash": run_a_hash,
        "run_b_hash": run_b_hash,
        "consistent": run_a_hash == run_b_hash,
        "assistant_notes": ["Hashes devem referenciar lineage temporal + snapshot de corpus."],
    }
