"""Compactação de replay em runtime."""

from __future__ import annotations

from typing import Any


def replay_compaction_runtime_stub(events: int, target: int) -> dict[str, Any]:
    return {
        "events": events,
        "target": target,
        "replay_compression_diagnostics": {"removed": max(0, events - target)},
        "assistant_notes": ["Preservar lineage de compactação."],
    }
