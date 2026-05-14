"""Monitorização de ramos em runtime."""

from __future__ import annotations

from typing import Any


def runtime_branch_monitoring_stub(width: int, cap: int) -> dict[str, Any]:
    return {"over_cap": width > cap, "width": width}
