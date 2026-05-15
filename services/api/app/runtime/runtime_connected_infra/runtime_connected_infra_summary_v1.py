"""runtime_connected_infra_summary_v1 — connected runtime infrastructure."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from app.observability.runtime_exporters.runtime_connected_observability_engine_v3 import (
    runtime_connected_observability_engine_v3,
)

_PACKAGING = Path("generated/runtime_artifacts/packaging_v1")


def runtime_connected_infra_engine_v1(scope: str) -> dict[str, Any]:
    obs = runtime_connected_observability_engine_v3(scope)
    token = f"trace-{scope}"
    otlp_degraded = obs.get("anomaly_counters", 0) > 0
    prom_export = "# HELP runtime_up runtime_up\nruntime_up 1\n"
    meta = {
        "scope": scope,
        "trace_token": token,
        "otlp_fallback": otlp_degraded,
        "packaging": "stdlib-bundle",
    }
    _PACKAGING.mkdir(parents=True, exist_ok=True)
    (_PACKAGING / f"{scope}.json").write_text(json.dumps(meta, indent=2) + "\n", encoding="utf-8")
    score = obs.get("observability_score", 0.9)
    integrity = "ok" if not otlp_degraded else "degraded"
    return {
        "connected_infra_score": round(score, 4),
        "trace_correlation_token": token,
        "prometheus_optional": prom_export[:64],
        "deployment_topology": {"nodes": 1, "scope": scope},
        "packaging_metadata": meta,
        "integrity_status": integrity,
        "runtime_confidence": round(score, 4),
    }


def runtime_connected_infra_summary_v1_stub(
    scope: str,
    *,
    storage_path: str | None = None,
) -> dict[str, Any]:
    report = runtime_connected_infra_engine_v1(scope)
    return {
        "scope": scope,
        "storage_path": storage_path or str(_PACKAGING),
        "assistant_notes": ["runtime_connected_infra_summary_v1: connected infra."],
        "deterministic_alignment": {"token": report["trace_correlation_token"]},
        "runtime_confidence": report["runtime_confidence"],
        "replay_summary": {},
        "lineage_summary": report["packaging_metadata"],
        "divergence_summary": {},
        "governance_summary": report["deployment_topology"],
        "lifecycle_summary": {},
        "operational_notes": ["otlp_degradation_fallback"],
        "integrity_status": report["integrity_status"],
        "connected_infra_score": report["connected_infra_score"],
    }
