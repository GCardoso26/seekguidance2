"""Snapshots de corpus replayáveis."""

from __future__ import annotations

from typing import Any


def replayable_snapshot_stub(snapshot_id: str, checksum: str) -> dict[str, Any]:
    return {"snapshot_id": snapshot_id, "checksum": checksum, "replayable": True}
