"""Deteção de snapshot corrompido."""

from __future__ import annotations


def corrupted_snapshot_detection(checksum_ok: bool, parse_ok: bool) -> dict[str, object]:
    return {"corrupted": not (checksum_ok and parse_ok)}
