"""Equivalência semântica entre dois replays."""

from __future__ import annotations

from typing import Any


def replay_equivalent(a: dict[str, Any], b: dict[str, Any]) -> bool:
    return (
        a.get("stable_replay_hash") == b.get("stable_replay_hash")
        and a.get("deterministic") == b.get("deterministic")
    )
