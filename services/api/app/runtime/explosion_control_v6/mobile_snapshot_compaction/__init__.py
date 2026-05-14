"""Compactação de snapshots móveis (v6 stub)."""

from __future__ import annotations

from typing import Any


def mobile_snapshot_compaction_stub(bytes_in: int, bytes_target: int) -> dict[str, Any]:
    return {
        "bytes_in": bytes_in,
        "bytes_target": bytes_target,
        "saved": max(0, bytes_in - bytes_target),
        "assistant_notes": ["Compactação documentada para auditoria de replay."],
        "replay_summary": {"format": "snap-v6"},
        "deterministic_alignment": {"hash_chain": "stub"},
    }
