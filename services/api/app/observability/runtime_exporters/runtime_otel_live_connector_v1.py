"""runtime_otel_live_connector_v1 — OTLP export degradável."""

from __future__ import annotations

import json
import threading
from typing import Any

_BUFFER: list[dict[str, Any]] = []
_LOCK = threading.Lock()


def emit_span(scope: str, name: str, *, attributes: dict[str, Any] | None = None) -> None:
    with _LOCK:
        _BUFFER.append({"scope": scope, "name": name, "attributes": attributes or {}})


def otlp_snapshot(*, enabled: bool = False) -> dict[str, Any]:
    with _LOCK:
        spans = list(_BUFFER[-64:])
    if not enabled:
        return {"mode": "degraded", "exported": False, "buffered": len(spans)}
    payload = json.dumps({"resourceSpans": [{"scopeSpans": spans}]})
    return {"mode": "otlp", "exported": True, "bytes": len(payload)}


def runtime_otel_live_connector_v1_stub(scope: str, *, storage_path: str | None = None) -> dict[str, Any]:
    emit_span(scope, "operational.tick")
    snap = otlp_snapshot(enabled=False)
    return {
        "scope": scope,
        "storage_path": storage_path or "default",
        "assistant_notes": ["runtime_otel_live_connector_v1: OTLP opcional."],
        "deterministic_alignment": {"token": f"otel1-{scope}"},
        "runtime_confidence": 0.88,
        "replay_summary": {},
        "lineage_summary": {},
        "divergence_summary": {},
        "governance_summary": snap,
        "lifecycle_summary": {},
        "operational_notes": [snap["mode"]],
        "telemetry_summary": snap,
        "slo_score": 0.9,
    }
