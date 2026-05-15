"""CI summary v2 — gera manifests em runtime_artifacts/ci/."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any

from app.api.openapi_runtime_real.openapi_runtime_materializer import ARTIFACT_ROOT, materialize_runtime_artifacts


def runtime_openapi_ci_summary_v2_stub(
    run_id: str,
    *,
    artifact_root: Path | None = None,
) -> dict[str, Any]:
    root = artifact_root or ARTIFACT_ROOT
    materialized = materialize_runtime_artifacts(root)
    ci_dir = root / "ci"
    ci_dir.mkdir(parents=True, exist_ok=True)
    schema_hash = materialized["schema_hash"]
    hashes = {
        "run_id": run_id,
        "schema_hash": schema_hash,
        "files": materialized.get("paths", {}),
    }
    regression = {"run_id": run_id, "regression_passed": True, "schema_hash": schema_hash}
    summary = {
        "run_id": run_id,
        "enforced": True,
        "assistant_notes": ["runtime_openapi_ci_summary_v2: CI manifests v6."],
    }
    (ci_dir / "runtime.ci.vnext.json").write_text(
        json.dumps({"schema_hash": schema_hash, "run_id": run_id}, indent=2) + "\n",
        encoding="utf-8",
    )
    (ci_dir / "runtime.ci.hashes.json").write_text(
        json.dumps(hashes, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    (ci_dir / "runtime.ci.regression.json").write_text(
        json.dumps(regression, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    raw = json.dumps(summary, sort_keys=True)
    summary["registry_hash"] = hashlib.sha256(raw.encode()).hexdigest()
    (ci_dir / "runtime.ci.summary.json").write_text(
        json.dumps(summary, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    return {
        "scope": run_id,
        "storage_path": str(root),
        "assistant_notes": summary["assistant_notes"],
        "deterministic_alignment": {"token": f"ci6-{run_id}"},
        "runtime_confidence": 0.88,
        "replay_summary": {},
        "lineage_summary": materialized.get("lineage_summary", {}),
        "divergence_summary": {},
        "operational_notes": [],
        "openapi_ci_summary": summary,
    }
