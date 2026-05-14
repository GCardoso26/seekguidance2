"""Profiling leve (hotspots, fanout) — sem sampler nativo obrigatório."""

from __future__ import annotations

import time
from collections.abc import Callable, Iterator
from contextlib import contextmanager
from typing import Any


@contextmanager
def profile_region(name: str, *, attrs: dict[str, Any] | None = None) -> Iterator[dict[str, Any]]:
    t0 = time.perf_counter()
    meta: dict[str, Any] = {"name": name, "attrs": attrs or {}}
    try:
        yield meta
    finally:
        meta["elapsed_ms"] = round((time.perf_counter() - t0) * 1000.0, 3)


def branch_fanout_metric(n_branches: int, *, cap: int) -> dict[str, Any]:
    return {"branches": n_branches, "cap": cap, "pressure": min(1.0, n_branches / max(1, cap))}


def timed_call(fn: Callable[[], Any], label: str) -> tuple[Any, dict[str, Any]]:
    with profile_region(label) as m:
        out = fn()
    return out, m
