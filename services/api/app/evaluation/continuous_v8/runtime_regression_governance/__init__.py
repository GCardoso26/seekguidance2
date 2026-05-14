"""Governança de regressões de runtime."""

from __future__ import annotations

from typing import Any


def runtime_regression_governance_v8_stub(open_issues: int) -> dict[str, Any]:
    return {
        "open_issues": open_issues,
        "regression_timelines": [],
        "assistant_notes": ["Alertas assistentes ligados a replay e solver."],
    }
