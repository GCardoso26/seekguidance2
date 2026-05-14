"""Replays de disputas multiplayer."""

from __future__ import annotations

from typing import Any


def multiplayer_dispute_replay_stub(players: int) -> dict[str, Any]:
    return {
        "players": players,
        "replay_legality_expectations": [],
        "distributed_runtime_semantics": "apnap_priority_stub",
        "assistant_notes": ["Governança de replay distribuído requer hashes alinhados."],
    }
