"""Alertas de regressão de runtime."""

from __future__ import annotations

from typing import Any


def runtime_regression_alerts_stub(regressed: bool) -> dict[str, Any]:
    return {"regressed": regressed, "assistant_notes": ["Runtime SLOs e alerting rules."]}
