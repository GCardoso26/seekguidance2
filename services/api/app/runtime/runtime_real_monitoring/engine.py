"""Monitoring bridge — degradável."""

from __future__ import annotations

from typing import Any

from app.runtime.runtime_real_observability_v2.engine import runtime_real_observability_engine_v2


def runtime_real_monitoring_engine_v1(scope: str) -> dict[str, Any]:
    return runtime_real_observability_engine_v2(scope, action="monitor")
