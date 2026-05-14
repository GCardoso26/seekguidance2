"""Ponte replay governance ↔ mobile (cloud opcional)."""

from __future__ import annotations

from typing import Any


def mobile_replay_bridge_stub(bundle_id: str) -> dict[str, Any]:
    return {
        "bundle_id": bundle_id,
        "chunk_streaming": True,
        "assistant_notes": ["Governança central preservada; mobile consome slices determinísticos."],
    }
