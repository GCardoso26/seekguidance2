"""runtime_persistence_real_v3."""
from __future__ import annotations

from app.runtime.persistent_replay_runtime.sqlite_runtime_replay_archive_v3 import sqlite_runtime_replay_archive_v3_stub

_KEYS = (
    "assistant_notes",
    "deterministic_alignment",
    "runtime_confidence",
    "governance_summary",
    "lifecycle_summary",
    "operational_notes",
    "divergence_summary",
    "replay_summary",
)


def test_runtime_persistence_real_v3_payload() -> None:
    p = sqlite_runtime_replay_archive_v3_stub("cpv3-sql")
    assert p["runtime_confidence"] > 0
    for k in _KEYS:
        assert k in p
