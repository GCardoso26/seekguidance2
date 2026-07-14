"""Product Analytics Runtime Engine — facade independent from frontend."""

from __future__ import annotations

import time
from typing import Any

from app.analytics_runtime.aggregators.engine import SourceSnapshot
from app.analytics_runtime.cache.store import RuntimeCache
from app.analytics_runtime.marts.store import MartStore
from app.analytics_runtime.materializers.pipeline import materialize_all
from app.analytics_runtime.observability.metrics import OBS
from app.analytics_runtime.providers.dashboards import DashboardProviders
from app.analytics_runtime.registry.metrics import validate_registry
from app.analytics_runtime.scheduler.scheduler import JobResult, Scheduler
from app.analytics_runtime.workers.sources import demo_snapshot


class AnalyticsRuntimeEngine:
    def __init__(self) -> None:
        self.store = MartStore()
        self.cache = RuntimeCache(default_ttl_seconds=30.0)
        self.scheduler = Scheduler()
        self.providers = DashboardProviders(self.store, self.cache)
        self.last_materialization: dict[str, Any] | None = None
        self._bootstrapped = False
        self.scheduler.register("near_realtime", 60.0, self._job_materialize)
        self.scheduler.register("every_5m", 300.0, self._job_materialize)
        self.scheduler.register("hourly", 3600.0, self._job_materialize)
        self.scheduler.register("daily", 86400.0, self._job_materialize)

    def bootstrap(self, snap: SourceSnapshot | None = None) -> dict[str, Any]:
        errors = validate_registry()
        if errors:
            raise RuntimeError(f"Metric registry invalid: {errors}")
        result = materialize_all(self.store, snap or demo_snapshot())
        self.cache.invalidate()
        self.last_materialization = result
        self._bootstrapped = True
        OBS.incr("runtime.bootstrap")
        OBS.observe("aggregation.duration_ms", float(result["duration_ms"]))
        return result

    def ensure_ready(self) -> None:
        if not self._bootstrapped or not self.store.ready():
            self.bootstrap()

    def materialize(self, snap: SourceSnapshot) -> dict[str, Any]:
        t0 = time.perf_counter()
        result = materialize_all(self.store, snap)
        self.cache.invalidate("mart:")
        self.cache.invalidate("dash:")
        self.last_materialization = result
        self._bootstrapped = True
        OBS.incr("runtime.materialize")
        OBS.observe("materialization.duration_ms", (time.perf_counter() - t0) * 1000)
        OBS.observe("aggregation.duration_ms", float(result["duration_ms"]))
        return result

    def _job_materialize(self) -> JobResult:
        t0 = time.perf_counter()
        try:
            # Scheduler tick reuses last snapshot semantics via demo if cold;
            # production API can inject DB snapshot before tick.
            if not self._bootstrapped:
                self.bootstrap()
            else:
                # Refresh from existing marts is no-op without new snap; mark ok
                pass
            return JobResult(
                name="materialize",
                ok=True,
                duration_ms=(time.perf_counter() - t0) * 1000,
                rows=(self.last_materialization or {}).get("source_rows", 0),
                cache_hit=self.cache.hits,
                cache_miss=self.cache.misses,
            )
        except Exception as exc:  # noqa: BLE001
            OBS.incr("scheduler.failures")
            return JobResult(
                name="materialize",
                ok=False,
                duration_ms=(time.perf_counter() - t0) * 1000,
                error=str(exc),
            )

    def tick(self, *, force: bool = False) -> dict[str, Any]:
        self.ensure_ready()
        results = self.scheduler.run_due(force=force)
        OBS.incr("scheduler.ticks")
        return {"results": [r.__dict__ for r in results], "scheduler": self.scheduler.stats()}

    def runtime_health(self) -> dict[str, Any]:
        self.ensure_ready()
        cache = self.cache.stats()
        mat = self.last_materialization or {}
        score = 100.0
        if cache["hit_ratio"] < 0.95 and (cache["hits"] + cache["misses"]) > 20:
            score -= 10
        if float(mat.get("duration_ms") or 0) > 300_000:
            score -= 20
        if not self.store.ready():
            score -= 40
        return {
            "runtime_health_score": round(max(0, score), 2),
            "aggregation_latency_ms": mat.get("duration_ms"),
            "materialization_duration_ms": mat.get("duration_ms"),
            "scheduler": self.scheduler.stats(),
            "cache": cache,
            "marts": self.store.list_marts(),
            "availability": 1.0 if self.store.ready() else 0.0,
            "observability": OBS.snapshot(),
            "targets": {
                "dashboard_ms": 300,
                "metric_query_ms": 100,
                "materialization_ms": 300_000,
                "alert_ms": 60_000,
                "cache_hit_ratio": 0.95,
            },
        }


# Process singleton
ENGINE = AnalyticsRuntimeEngine()
