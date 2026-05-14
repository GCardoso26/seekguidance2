"""Modo offline e continuação de replay (stubs)."""

from __future__ import annotations

from typing import Any


def offline_replay_mode_stub(bundle_id: str) -> dict[str, Any]:
    return {
        "bundle_id": bundle_id,
        "mode": "offline",
        "assistant_notes": ["Replay local com hashes determinísticos resumidos.", "Upload atrasado quando online."],
    }
