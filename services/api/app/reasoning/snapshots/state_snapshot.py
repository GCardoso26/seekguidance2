"""Instantâneo imutável do estado simbólico."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class StateSnapshotRecord:
    snapshot_id: str
    registry_objects: tuple[dict[str, Any], ...]
    event_cursor: int
