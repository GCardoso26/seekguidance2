"""Internal scheduler for Analytics Runtime jobs."""

from __future__ import annotations

import threading
import time
from collections.abc import Callable
from dataclasses import dataclass, field
from typing import Any


@dataclass
class JobResult:
    name: str
    ok: bool
    duration_ms: float
    rows: int = 0
    error: str | None = None
    cache_hit: int = 0
    cache_miss: int = 0


@dataclass
class JobDef:
    name: str
    interval_seconds: float
    fn: Callable[[], JobResult]
    last_run: float | None = None
    last_result: JobResult | None = None
    failures: int = 0
    retries: int = 0


@dataclass
class Scheduler:
    jobs: dict[str, JobDef] = field(default_factory=dict)
    _lock: threading.RLock = field(default_factory=threading.RLock)
    started_at: float = field(default_factory=time.time)

    def register(self, name: str, interval_seconds: float, fn: Callable[[], JobResult]) -> None:
        with self._lock:
            self.jobs[name] = JobDef(name=name, interval_seconds=interval_seconds, fn=fn)

    def run_due(self, *, force: bool = False) -> list[JobResult]:
        now = time.time()
        results: list[JobResult] = []
        with self._lock:
            items = list(self.jobs.values())
        for job in items:
            due = force or job.last_run is None or (now - job.last_run) >= job.interval_seconds
            if not due:
                continue
            try:
                result = job.fn()
                if not result.ok and job.retries < 2:
                    job.retries += 1
                    result = job.fn()
                job.last_run = time.time()
                job.last_result = result
                if not result.ok:
                    job.failures += 1
                else:
                    job.retries = 0
                results.append(result)
            except Exception as exc:  # noqa: BLE001 — job isolation
                job.failures += 1
                job.last_run = time.time()
                fail = JobResult(name=job.name, ok=False, duration_ms=0, error=str(exc))
                job.last_result = fail
                results.append(fail)
        return results

    def stats(self) -> dict[str, Any]:
        with self._lock:
            return {
                "uptime_seconds": round(time.time() - self.started_at, 2),
                "jobs": [
                    {
                        "name": j.name,
                        "interval_seconds": j.interval_seconds,
                        "last_run": j.last_run,
                        "failures": j.failures,
                        "retries": j.retries,
                        "last_ok": j.last_result.ok if j.last_result else None,
                        "last_duration_ms": j.last_result.duration_ms if j.last_result else None,
                        "last_rows": j.last_result.rows if j.last_result else None,
                    }
                    for j in self.jobs.values()
                ],
            }
