"""Integridade de snapshot de replay."""

from __future__ import annotations

from typing import Any


def replay_snapshot_integrity_stub(snap_id: str, ok: bool) -> dict[str, Any]:
    return {
        "snap_id": snap_id,
        "replay_integrity_diagnostics": {"ok": ok},
        "assistant_notes": ["Fingerprints e hashes resumidos."],
    }
