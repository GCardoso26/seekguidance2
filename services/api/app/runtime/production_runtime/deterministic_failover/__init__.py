"""Failover determinístico."""

from __future__ import annotations

from typing import Any


def deterministic_failover_stub(primary_up: bool) -> dict[str, Any]:
    return {"use_secondary": not primary_up, "assistant_notes": ["Deterministic failover sem divergência silenciosa."]}
