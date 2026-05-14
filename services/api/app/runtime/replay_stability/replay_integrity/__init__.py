"""Integridade de replay."""

from __future__ import annotations

from typing import Any


def replay_integrity_stub(hash_expected: str, hash_observed: str) -> dict[str, Any]:
    return {"ok": hash_expected == hash_observed}
