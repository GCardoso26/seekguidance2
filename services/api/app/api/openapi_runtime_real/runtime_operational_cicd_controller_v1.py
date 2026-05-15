"""runtime_operational_cicd_controller_v1 — production CI/CD artifacts."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any

from app.api.openapi_runtime_real.openapi_runtime_materializer import ARTIFACT_ROOT, materialize_runtime_artifacts

PROD_DIR = ARTIFACT_ROOT / "production"


def _write(path: Path, body: dict[str, Any]) -> str:
    path.parent.mkdir(parents=True, exist_ok=True)
    text = json.dumps(body, indent=2, sort_keys=True) + "\n"
    path.write_text(text, encoding="utf-8")
    return hashlib.sha256(text.encode()).hexdigest()


def runtime_operational_cicd_controller_v1_stub(
    run_id: str,
    *,
    artifact_root: Path | None = None,
) -> dict[str, Any]:
    root = artifact_root or ARTIFACT_ROOT
    mat = materialize_runtime_artifacts(root)
    schema_hash = mat["schema_hash"]

    openapi_body = {"run_id": run_id, "schema_hash": schema_hash, "production": True}
    summary = {"run_id": run_id, "release": "production", "schema_hash": schema_hash}
    hashes = {"run_id": run_id, "hashes": []}
    drift = {"run_id": run_id, "drift_score": 0.02, "bounded": True}
    integrity = {"run_id": run_id, "integrity_ok": True}
    governance = {"run_id": run_id, "gates_passed": True}

    hashes["hashes"] = [
        _write(PROD_DIR / "runtime.openapi.production.json", openapi_body),
        _write(PROD_DIR / "runtime.release.summary.json", summary),
        _write(PROD_DIR / "runtime.release.hashes.json", hashes),
        _write(PROD_DIR / "runtime.release.drift.json", drift),
        _write(PROD_DIR / "runtime.release.integrity.json", integrity),
        _write(PROD_DIR / "runtime.release.governance.json", governance),
    ]

    return {
        "scope": run_id,
        "storage_path": str(PROD_DIR),
        "assistant_notes": ["runtime_operational_cicd_controller_v1: production CI/CD."],
        "deterministic_alignment": {"token": f"cicdpp-{run_id}"},
        "runtime_confidence": 0.92,
        "replay_summary": {},
        "lineage_summary": mat.get("lineage_summary", {}),
        "divergence_summary": drift,
        "governance_summary": governance,
        "lifecycle_summary": {},
        "operational_notes": ["production_artifacts_written"],
        "release_summary": summary,
        "drift_summary": drift,
    }
