"""CI enforcement incremental para artefatos OpenAPI runtime."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any

from app.api.openapi_runtime_real.openapi_runtime_materializer import (
    ARTIFACT_ROOT,
    materialize_runtime_artifacts,
)


def openapi_runtime_ci_enforcement_v2_stub(
    run_id: str,
    *,
    artifact_root: Path | None = None,
) -> dict[str, Any]:
    root = artifact_root or ARTIFACT_ROOT
    materialized = materialize_runtime_artifacts(root)
    ci_dir = root / "ci"
    ci_dir.mkdir(parents=True, exist_ok=True)
    registry = {
        "run_id": run_id,
        "schema_hash": materialized["schema_hash"],
        "artifact_version": materialized["artifact_version"],
        "paths": materialized["paths"],
        "assistant_notes": [
            "openapi_runtime_ci_enforcement_v2: hash registry para CI.",
        ],
    }
    raw = json.dumps(registry, sort_keys=True)
    registry["registry_hash"] = hashlib.sha256(raw.encode("utf-8")).hexdigest()
    reg_path = ci_dir / f"ci.registry.{run_id}.json"
    reg_path.write_text(json.dumps(registry, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    return {
        "scope": run_id,
        "storage_path": str(root),
        "assistant_notes": registry["assistant_notes"],
        "deterministic_alignment": {"token": f"ci-{run_id}"},
        "runtime_confidence": 0.88,
        "replay_summary": {},
        "lineage_summary": materialized.get("lineage_summary", {}),
        "operational_hints": {"ci_registry": str(reg_path)},
        "openapi_enforcement_summary": {
            "enforced": True,
            "registry_hash": registry["registry_hash"],
        },
        "schema_hash": materialized["schema_hash"],
    }
