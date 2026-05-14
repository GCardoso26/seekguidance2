"""Versionamento monotónico de estados semânticos."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass
class StateVersion:
    logical_clock: int
    partition_id: str


def bump_version(prev: StateVersion) -> StateVersion:
    return StateVersion(logical_clock=prev.logical_clock + 1, partition_id=prev.partition_id)
