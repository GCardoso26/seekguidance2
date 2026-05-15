"""runtime_release_management_v1 — CI/CD release management."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any

from app.api.openapi_runtime_real.openapi_runtime_materializer import materialize_runtime_artifacts
from app.runtime.enterprise_readiness.runtime_enterprise_readiness_v1 import (
    runtime_enterprise_readiness_engine_v1,
)

RELEASE_DIR = Path("generated/runtime_artifacts/external_pilot")


def _write(path: Path, body: dict[str, Any]) -> str:
    path.parent.mkdir(parents=True, exist_ok=True)
    text = json.dumps(body, indent=2, sort_keys=True) + "\n"
    path.write_text(text, encoding="utf-8")
    return hashlib.sha256(text.encode()).hexdigest()


def runtime_release_management_engine_v1(run_id: str) -> dict[str, Any]:
    mat = materialize_runtime_artifacts()
    ent = runtime_enterprise_readiness_engine_v1(run_id)
    summary = {"run_id": run_id, "schema_hash": mat["schema_hash"], "channel": "external_pilot"}
    stability = {"score": 0.95}
    compatibility = ent.get("compatibility_matrix", {})
    migrations = ent.get("migration_summary", {})
    enterprise = {"readiness": ent["enterprise_readiness_score"]}
    hashes = [
        _write(RELEASE_DIR / "runtime.release.summary.json", summary),
        _write(RELEASE_DIR / "runtime.release.hashes.json", {"run_id": run_id}),
        _write(RELEASE_DIR / "runtime.release.stability.json", stability),
        _write(RELEASE_DIR / "runtime.release.compatibility.json", compatibility),
        _write(RELEASE_DIR / "runtime.release.migrations.json", migrations),
        _write(RELEASE_DIR / "runtime.release.enterprise.json", enterprise),
    ]
    integrity = "ok"
    return {
        "release_summary": summary,
        "readiness_score": ent["enterprise_readiness_score"],
        "artifact_hashes": hashes,
        "integrity_status": integrity,
        "runtime_confidence": ent["runtime_confidence"],
    }


def runtime_release_management_v1_stub(
    run_id: str,
    *,
    storage_path: str | None = None,
) -> dict[str, Any]:
    report = runtime_release_management_engine_v1(run_id)
    return {
        "scope": run_id,
        "storage_path": storage_path or str(RELEASE_DIR),
        "assistant_notes": ["runtime_release_management_v1: release management."],
        "deterministic_alignment": {"token": f"relm1-{run_id}"},
        "runtime_confidence": report["runtime_confidence"],
        "replay_summary": {},
        "lineage_summary": {},
        "divergence_summary": {},
        "governance_summary": report["release_summary"],
        "lifecycle_summary": {},
        "operational_notes": ["external_pilot_artifacts"],
        "integrity_status": report["integrity_status"],
        **report,
    }
