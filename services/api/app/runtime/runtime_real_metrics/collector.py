"""Coleta de métricas runtime — memória + SQLite opcional."""

from __future__ import annotations

import sqlite3
import time
from pathlib import Path
from typing import Any

_STORE: dict[str, float] = {}
_DB = Path("generated/runtime_real_metrics/metrics.sqlite")
_COUNTERS: dict[str, int] = {}


def _init_db() -> None:
    _DB.parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(_DB) as conn:
        conn.execute(
            "CREATE TABLE IF NOT EXISTS metrics (name TEXT, value REAL, ts REAL)"
        )


def record(name: str, value: float = 1.0) -> None:
    _STORE[name] = _STORE.get(name, 0.0) + value
    _COUNTERS[name] = _COUNTERS.get(name, 0) + 1
    _init_db()
    with sqlite3.connect(_DB) as conn:
        conn.execute("INSERT INTO metrics (name, value, ts) VALUES (?,?,?)", (name, value, time.time()))
        conn.commit()


def snapshot() -> dict[str, Any]:
    _init_db()
    with sqlite3.connect(_DB) as conn:
        rows = conn.execute(
            "SELECT name, SUM(value), COUNT(*) FROM metrics GROUP BY name"
        ).fetchall()
    agg = {r[0]: {"sum": r[1], "count": r[2]} for r in rows}
    return {
        "gauges": dict(_STORE),
        "counters": dict(_COUNTERS),
        "aggregates": agg,
        "ts": time.time(),
    }


def prometheus_text() -> str:
    snap = snapshot()
    lines: list[str] = []
    for name, data in snap.get("aggregates", {}).items():
        safe = name.replace(".", "_").replace("-", "_")
        lines.append(f"# TYPE {safe} counter")
        lines.append(f"runtime_{safe}_total {data.get('sum', 0)}")
    return "\n".join(lines) + "\n"
