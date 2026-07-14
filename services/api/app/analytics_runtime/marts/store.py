"""In-process materialized Data Mart store. Dashboards MUST only read from here."""

from __future__ import annotations

import threading
import time
from copy import deepcopy
from dataclasses import dataclass, field
from typing import Any

MART_NAMES = (
    "mart_orders",
    "mart_search",
    "mart_conversion",
    "mart_buyers",
    "mart_sellers",
    "mart_catalog",
    "mart_product_health",
    "mart_north_star",
    "mart_funnels",
    "mart_cohorts",
    "mart_alerts",
    "mart_top_movers",
    "mart_marketplace",
    "mart_product_metrics",
)


@dataclass
class MartSnapshot:
    name: str
    payload: dict[str, Any]
    version: int
    materialized_at: float
    source_rows: int = 0
    duration_ms: float = 0.0


@dataclass
class MartStore:
    """Materialized marts. Never expose analytics_events to dashboard consumers."""

    _data: dict[str, MartSnapshot] = field(default_factory=dict)
    _lock: threading.RLock = field(default_factory=threading.RLock)
    _versions: dict[str, int] = field(default_factory=dict)

    def put(
        self,
        name: str,
        payload: dict[str, Any],
        *,
        source_rows: int = 0,
        duration_ms: float = 0.0,
    ) -> MartSnapshot:
        if name not in MART_NAMES:
            raise ValueError(f"Unknown mart: {name}")
        with self._lock:
            ver = self._versions.get(name, 0) + 1
            self._versions[name] = ver
            snap = MartSnapshot(
                name=name,
                payload=deepcopy(payload),
                version=ver,
                materialized_at=time.time(),
                source_rows=source_rows,
                duration_ms=duration_ms,
            )
            self._data[name] = snap
            return snap

    def get(self, name: str) -> dict[str, Any]:
        with self._lock:
            snap = self._data.get(name)
            if snap is None:
                return {"mart": name, "empty": True, "payload": {}}
            return {
                "mart": name,
                "empty": False,
                "version": snap.version,
                "materialized_at": snap.materialized_at,
                "source_rows": snap.source_rows,
                "duration_ms": snap.duration_ms,
                "payload": deepcopy(snap.payload),
            }

    def get_payload(self, name: str) -> dict[str, Any]:
        return self.get(name).get("payload") or {}

    def list_marts(self) -> list[dict[str, Any]]:
        with self._lock:
            out = []
            for name in MART_NAMES:
                snap = self._data.get(name)
                out.append(
                    {
                        "name": name,
                        "ready": snap is not None,
                        "version": snap.version if snap else 0,
                        "materialized_at": snap.materialized_at if snap else None,
                        "duration_ms": snap.duration_ms if snap else None,
                    }
                )
            return out

    def ready(self) -> bool:
        with self._lock:
            return all(n in self._data for n in MART_NAMES)
