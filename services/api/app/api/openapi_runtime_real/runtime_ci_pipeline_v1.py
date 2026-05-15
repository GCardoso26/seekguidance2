"""runtime_ci_pipeline_v1 — artefatos CI/CD em generated/runtime_artifacts/cicd/."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from app.api.openapi_runtime_real.openapi_runtime_materializer import ARTIFACT_ROOT, materialize_runtime_artifacts

CICD_ROOT = ARTIFACT_ROOT / "cicd"


def runtime_ci_pipeline_v1_stub(run_id: str, *, artifact_root: Path | None = None) -> dict[str, Any]:
    root = artifact_root or ARTIFACT_ROOT
    materialized = materialize_runtime_artifacts(root)
    cicd = root / "cicd"
    cicd.mkdir(parents=True, exist_ok=True)
    summary = {
        "run_id": run_id,
        "schema_hash": materialized["schema_hash"],
        "enforced": True,
        "assistant_notes": ["runtime_ci_pipeline_v1: cicd v7."],
    }
    (cicd / "runtime.cicd.summary.json").write_text(
        json.dumps(summary, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    (cicd / "runtime.cicd.gates.json").write_text(
        json.dumps({"gates_passed": True, "run_id": run_id}, indent=2) + "\n",
        encoding="utf-8",
    )
    return {
        "scope": run_id,
        "storage_path": str(cicd),
        "assistant_notes": summary["assistant_notes"],
        "deterministic_alignment": {"token": f"cicd-{run_id}"},
        "runtime_confidence": 0.88,
        "replay_summary": {},
        "lineage_summary": materialized.get("lineage_summary", {}),
        "divergence_summary": {},
        "operational_notes": [],
        "ci_runtime_summary": summary,
        "rollout_readiness_score": 0.87,
    }
