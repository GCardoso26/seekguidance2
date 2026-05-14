"""Regressões de consistência de replay."""

from __future__ import annotations

from typing import Any


def replay_consistency_regressions_stub(flags: list[bool]) -> dict[str, Any]:
    bad = sum(1 for f in flags if not f)
    return {"failure_rate": bad / len(flags) if flags else 0.0}
