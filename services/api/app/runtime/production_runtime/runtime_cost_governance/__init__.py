"""Governança de custo de runtime."""

from __future__ import annotations

from typing import Any


def runtime_cost_governance_stub(budget_units: float, used: float) -> dict[str, Any]:
    return {"over": used > budget_units, "assistant_notes": ["Runtime cost governance live."]}
