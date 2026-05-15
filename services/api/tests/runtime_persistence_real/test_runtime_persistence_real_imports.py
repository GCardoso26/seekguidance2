"""runtime_persistence_real."""
from __future__ import annotations

from app.runtime.persistent_replay_runtime.sqlite_runtime_temporal_store_v1 import sqlite_runtime_temporal_store_v1_stub

_KEYS = (
    "assistant_notes",
    "deterministic_alignment",
    "runtime_confidence",
    "divergence_summary",
    "operational_notes",
    "replay_summary",
    "governance_summary",
    "lineage_summary",
)


def test_runtime_persistence_real_payload() -> None:
    p = sqlite_runtime_temporal_store_v1_stub("pp-sql")
    assert p["runtime_confidence"] > 0
    for k in _KEYS:
        assert k in p
