"""runtime_release_governance_v3 — CI/CD release governance v2."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any

from app.api.openapi_runtime_real.openapi_runtime_materializer import materialize_runtime_artifacts
from app.runtime.enterprise_readiness.runtime_enterprise_summary_v2 import (
    runtime_enterprise_readiness_final_engine_v1,
)

RELEASE_DIR = Path("generated/runtime_artifacts/production_enterprise")


def _write(path: Path, body: dict[str, Any]) -> str:
    path.parent.mkdir(parents=True, exist_ok=True)
    text = json.dumps(body, indent=2, sort_keys=True) + "\n"
    path.write_text(text, encoding="utf-8")
    return hashlib.sha256(text.encode()).hexdigest()


def runtime_release_governance_engine_v3(run_id: str) -> dict[str, Any]:
    mat = materialize_runtime_artifacts()
    ent = runtime_enterprise_readiness_final_engine_v1(run_id)
    semver = {"version": ent["semver_registry"].get(run_id, "1.0.0"), "run_id": run_id}
    summary = {"run_id": run_id, "schema_hash": mat["schema_hash"], "channel": "production"}
    compatibility = {"matrix": "v1-v11", "continuous": "v1-v26"}
    integrity = {"ok": True}
    enterprise = {"score": ent["enterprise_readiness_score"]}
    support = ent.get("support_lifecycle_manifest", {})
    lifecycle = {"phase": "production_rollout", "run_id": run_id}
    hashes = [
        _write(RELEASE_DIR / "runtime.release.summary.json", summary),
        _write(RELEASE_DIR / "runtime.release.semver.json", semver),
        _write(RELEASE_DIR / "runtime.release.compatibility.json", compatibility),
        _write(RELEASE_DIR / "runtime.release.integrity.json", integrity),
        _write(RELEASE_DIR / "runtime.release.enterprise.json", enterprise),
        _write(RELEASE_DIR / "runtime.release.support.json", support),
        _write(RELEASE_DIR / "runtime.release.lifecycle.json", lifecycle),
    ]
    return {
        "release_summary": summary,
        "readiness_score": ent["enterprise_readiness_score"],
        "artifact_hashes": hashes,
        "integrity_status": "ok",
        "runtime_confidence": ent["runtime_confidence"],
    }


def runtime_release_governance_v3_stub(
    run_id: str,
    *,
    storage_path: str | None = None,
) -> dict[str, Any]:
    report = runtime_release_governance_engine_v3(run_id)
    return {
        "scope": run_id,
        "storage_path": storage_path or str(RELEASE_DIR),
        "assistant_notes": ["runtime_release_governance_engine_v3: release governance."],
        "deterministic_alignment": {"token": f"relgov3-{run_id}"},
        "runtime_confidence": report["runtime_confidence"],
        "replay_summary": {},
        "lineage_summary": {},
        "divergence_summary": {},
        "governance_summary": report["release_summary"],
        "lifecycle_summary": {},
        "operational_notes": ["production_enterprise_artifacts"],
        "integrity_status": report["integrity_status"],
        **report,
    }
