"""Profiler de custo de ramos (fanout / factor)."""

from __future__ import annotations

from typing import Any

from app.observability.profiling.hotspots import branch_fanout_metric, profile_region


def profile_branch_cost(name: str, n_branches: int, *, cap: int) -> dict[str, Any]:
    with profile_region(name, attrs=branch_fanout_metric(n_branches, cap=cap)) as m:
        m["branch_factor"] = round(n_branches / max(1, cap), 4)
    return m
