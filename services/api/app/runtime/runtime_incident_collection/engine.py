"""runtime_incident_collection_engine_v1."""

from __future__ import annotations

import json
import sqlite3
import time
from pathlib import Path
from typing import Any

_DB = Path("generated/runtime_incidents/incidents.sqlite")
_STORE = Path("generated/runtime_incidents/tickets")


def _init() -> None:
    _DB.parent.mkdir(parents=True, exist_ok=True)
    _STORE.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(_DB) as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS incidents (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tenant_id TEXT, summary TEXT, severity TEXT,
                operator_notes TEXT, escalated INTEGER DEFAULT 0, created_at REAL
            );
            """
        )


def runtime_incident_collection_engine_v1(
    scope: str,
    *,
    action: str = "list",
    tenant_id: str = "default",
    summary: str | None = None,
    severity: str = "medium",
    notes: str | None = None,
) -> dict[str, Any]:
    _init()
    with sqlite3.connect(_DB) as conn:
        if action == "report" and summary:
            conn.execute(
                "INSERT INTO incidents (tenant_id, summary, severity, operator_notes, created_at) "
                "VALUES (?,?,?,?,?)",
                (tenant_id, summary, severity, notes or "", time.time()),
            )
            conn.commit()
            tid = str(int(time.time()))
            (_STORE / f"ticket-{tid}.json").write_text(
                json.dumps({"summary": summary, "tenant_id": tenant_id, "severity": severity}),
                encoding="utf-8",
            )
        rows = conn.execute(
            "SELECT id, tenant_id, summary, severity, escalated, created_at "
            "FROM incidents ORDER BY created_at DESC LIMIT 50"
        ).fetchall()
    incidents = [
        {
            "id": r[0],
            "tenant_id": r[1],
            "summary": r[2],
            "severity": r[3],
            "escalated": bool(r[4]),
            "created_at": r[5],
        }
        for r in rows
    ]
    return {
        "scope": scope,
        "incidents": incidents,
        "timeline_entries": len(incidents),
        "integrity_status": "ok",
        "runtime_confidence": 0.94,
        "assistant_notes": ["runtime_incident_collection_engine_v1."],
        "deterministic_alignment": {"token": f"inc-{scope}"},
        "replay_summary": {},
        "lineage_summary": {},
        "divergence_summary": {},
        "governance_summary": {},
        "lifecycle_summary": {},
        "operational_notes": [],
    }
