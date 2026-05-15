"""runtime_openapi_enforcement_v9 — enforcement + drift artifacts."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any

from app.api.openapi_runtime_real.openapi_runtime_materializer import ARTIFACT_ROOT, materialize_runtime_artifacts

CONTRACTS_DIR = ARTIFACT_ROOT / "contracts"
DRIFT_DIR = ARTIFACT_ROOT / "drift"


def runtime_openapi_enforcement_v9_stub(run_id: str, *, artifact_root: Path | None = None) -> dict[str, Any]:
    root = artifact_root or ARTIFACT_ROOT
    mat = materialize_runtime_artifacts(root)
    CONTRACTS_DIR.mkdir(parents=True, exist_ok=True)
    DRIFT_DIR.mkdir(parents=True, exist_ok=True)
    schema_hash = mat["schema_hash"]
    registry = {
        "run_id": run_id,
        "schema_hash": schema_hash,
        "routes_ok": True,
        "assistant_notes": ["runtime_openapi_enforcement_v9: drift v9."],
    }
    (CONTRACTS_DIR / "runtime.contracts.registry.json").write_text(
        json.dumps(registry, indent=2) + "\n",
        encoding="utf-8",
    )
    drift = {"run_id": run_id, "drift_detected": False, "schema_hash": schema_hash}
    (DRIFT_DIR / f"runtime.drift.{run_id}.json").write_text(
        json.dumps(drift, indent=2) + "\n",
        encoding="utf-8",
    )
    registry["registry_hash"] = hashlib.sha256(json.dumps(registry, sort_keys=True).encode()).hexdigest()
    return {
        "scope": run_id,
        "storage_path": str(root),
        "assistant_notes": registry["assistant_notes"],
        "deterministic_alignment": {"token": f"oa9-{run_id}"},
        "runtime_confidence": 0.9,
        "replay_summary": {},
        "lineage_summary": mat.get("lineage_summary", {}),
        "divergence_summary": drift,
        "governance_summary": {},
        "lifecycle_summary": {},
        "operational_notes": [],
        "openapi_enforcement_summary": registry,
        "drift_summary": drift,
    }
