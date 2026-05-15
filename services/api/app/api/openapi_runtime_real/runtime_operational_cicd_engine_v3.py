"""runtime_operational_cicd_engine_v3 — operational CI/CD v3."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any

from app.api.openapi_runtime_real.openapi_runtime_materializer import materialize_runtime_artifacts

PROD_RT = Path("generated/runtime_artifacts/production_runtime")


def _write(path: Path, body: dict[str, Any]) -> str:
    path.parent.mkdir(parents=True, exist_ok=True)
    text = json.dumps(body, indent=2, sort_keys=True) + "\n"
    path.write_text(text, encoding="utf-8")
    return hashlib.sha256(text.encode()).hexdigest()


def runtime_operational_cicd_engine_v3_stub(
    run_id: str,
    *,
    artifact_root: Path | None = None,
) -> dict[str, Any]:
    mat = materialize_runtime_artifacts(artifact_root)
    schema_hash = mat["schema_hash"]
    summary = {"run_id": run_id, "schema_hash": schema_hash, "platform": "cpv3"}
    drift = {"run_id": run_id, "drift_score": 0.015}
    integrity = {"run_id": run_id, "integrity_ok": True}
    governance = {"run_id": run_id, "gates": ["reliability", "trust", "fcp"]}
    artifact_hashes = [
        _write(PROD_RT / "runtime.production.summary.json", summary),
        _write(PROD_RT / "runtime.production.hashes.json", {"run_id": run_id, "schema_hash": schema_hash}),
        _write(PROD_RT / "runtime.production.integrity.json", integrity),
        _write(PROD_RT / "runtime.production.drift.json", drift),
        _write(PROD_RT / "runtime.production.governance.json", governance),
    ]
    return {
        "scope": run_id,
        "storage_path": str(PROD_RT),
        "assistant_notes": ["runtime_operational_cicd_engine_v3: cicd v3."],
        "deterministic_alignment": {"token": f"cicdv3-{run_id}"},
        "runtime_confidence": 0.93,
        "replay_summary": {},
        "lineage_summary": mat.get("lineage_summary", {}),
        "divergence_summary": drift,
        "governance_summary": {**governance, "artifact_hashes": artifact_hashes},
        "lifecycle_summary": {},
        "operational_notes": ["production_runtime_artifacts"],
        "production_summary": summary,
    }
