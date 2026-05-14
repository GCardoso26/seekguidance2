"""Snapshots semânticos versionados."""

from __future__ import annotations

from typing import Any


def make_snapshot(version: str, payload: dict[str, Any]) -> dict[str, Any]:
    return {"version": version, "payload": payload}
