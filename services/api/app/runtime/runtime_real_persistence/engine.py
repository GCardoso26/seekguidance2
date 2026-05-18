"""runtime_real_persistence_engine_v1."""

from __future__ import annotations

import json
import time
from typing import Any

from app.runtime.runtime_real_persistence.config import _ARTIFACTS, backend
from app.runtime.runtime_real_persistence.schema import bootstrap_schema


def runtime_real_persistence_engine_v1(
    scope: str,
    *,
    action: str = "health",
) -> dict[str, Any]:
    _ARTIFACTS.mkdir(parents=True, exist_ok=True)
    health: dict[str, Any] = {"backend": backend(), "scope": scope}
    try:
        if action in ("bootstrap", "health", "migrate"):
            boot = bootstrap_schema()
            health.update(boot)
        if action == "diagnostics":
            health["tables"] = [
                "tenants",
                "users",
                "replays",
                "runtime_events",
                "incidents",
                "metrics",
                "audit_entries",
            ]
        health["ok"] = True
    except Exception as exc:  # noqa: BLE001 — degradável
        health["ok"] = False
        health["error"] = str(exc)
    snap = {
        "scope": scope,
        "ts": time.time(),
        "health": health,
        "integrity_status": "ok" if health.get("ok") else "degraded",
    }
    ( _ARTIFACTS / "last_health.json").write_text(json.dumps(snap, indent=2), encoding="utf-8")
    return _payload(scope, health)


def _payload(scope: str, extra: dict[str, Any]) -> dict[str, Any]:
    return {
        "scope": scope,
        "assistant_notes": ["runtime_real_persistence_engine_v1: SQLite default, Postgres opcional."],
        "deterministic_alignment": {"token": f"persist-{scope}"},
        "runtime_confidence": 0.94,
        "replay_summary": {},
        "lineage_summary": {},
        "divergence_summary": {},
        "governance_summary": {},
        "lifecycle_summary": {},
        "operational_notes": [],
        "integrity_status": extra.get("integrity_status", "ok" if extra.get("ok") else "degraded"),
        **extra,
    }
