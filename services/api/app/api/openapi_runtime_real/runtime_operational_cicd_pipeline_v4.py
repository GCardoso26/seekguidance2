"""runtime_operational_cicd_pipeline_v4 — release candidate artifacts."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any

from app.api.openapi_runtime_real.openapi_runtime_materializer import ARTIFACT_ROOT, materialize_runtime_artifacts

RC_DIR = ARTIFACT_ROOT / "release_candidate"


def _write(path: Path, body: dict[str, Any]) -> str:
    path.parent.mkdir(parents=True, exist_ok=True)
    text = json.dumps(body, indent=2, sort_keys=True) + "\n"
    path.write_text(text, encoding="utf-8")
    return hashlib.sha256(text.encode()).hexdigest()


def runtime_operational_cicd_pipeline_v4_stub(
    run_id: str,
    *,
    artifact_root: Path | None = None,
) -> dict[str, Any]:
    root = artifact_root or ARTIFACT_ROOT
    mat = materialize_runtime_artifacts(root)
    schema_hash = mat["schema_hash"]

    summary = {
        "run_id": run_id,
        "release_candidate": True,
        "schema_hash": schema_hash,
        "assistant_notes": ["runtime.release.summary RC"],
    }
    hashes = {"run_id": run_id, "schema_hash": schema_hash, "artifacts": []}
    drift = {"run_id": run_id, "drift_score": 0.03, "bounded": True}
    integrity = {"run_id": run_id, "integrity_ok": True, "routes_ok": True}

    hashes["artifacts"] = [
        _write(RC_DIR / "runtime.release.summary.json", summary),
        _write(RC_DIR / "runtime.release.hashes.json", hashes),
        _write(RC_DIR / "runtime.release.drift.json", drift),
        _write(RC_DIR / "runtime.release.integrity.json", integrity),
    ]

    return {
        "scope": run_id,
        "storage_path": str(RC_DIR),
        "assistant_notes": ["runtime_operational_cicd_pipeline_v4: CI/CD RC."],
        "deterministic_alignment": {"token": f"cicd4-{run_id}"},
        "runtime_confidence": 0.91,
        "replay_summary": {},
        "lineage_summary": mat.get("lineage_summary", {}),
        "divergence_summary": drift,
        "governance_summary": hashes,
        "lifecycle_summary": {},
        "operational_notes": ["release_candidate_artifacts_written"],
        "release_summary": summary,
        "drift_summary": drift,
    }
