"""Snapshots de integridade de replay (stub)."""

from __future__ import annotations

from typing import Any


def replay_integrity_snapshot_stub(replay_ref: str) -> dict[str, Any]:
    return {
        "replay_ref": replay_ref,
        "integrity_snapshot": {"checksum_family": "blake3_stub", "anchors": []},
        "assistant_notes": ["replay_integrity_snapshot: evidência auditável para o juiz."],
    }
