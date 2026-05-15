"""Registry e histórico versionado de artefatos runtime."""

from __future__ import annotations

import hashlib
import json
import time
from pathlib import Path
from typing import Any

from app.api.openapi_runtime_real.openapi_runtime_materializer import materialize_runtime_artifacts

HISTORY_ROOT = (
    Path(__file__).resolve().parents[3] / "generated" / "runtime_artifacts" / "history"
)


def register_runtime_artifact_history(
    root: Path | None = None,
    *,
    version_label: str | None = None,
) -> dict[str, Any]:
    """Materializa artefatos atuais e grava snapshot histórico versionado."""
    history = root or HISTORY_ROOT
    history.mkdir(parents=True, exist_ok=True)
    label = version_label or time.strftime("%Y%m%dT%H%M%SZ", time.gmtime())
    version_dir = history / label
    version_dir.mkdir(parents=True, exist_ok=True)

    meta = materialize_runtime_artifacts(version_dir)
    schema_hash = meta["schema_hash"]

    lineage_hashes = {
        "manifest": hashlib.sha256(
            (version_dir / "manifests" / "runtime.manifest.vnext.json").read_bytes()
        ).hexdigest()[:16],
        "snapshot": hashlib.sha256(
            (version_dir / "snapshots" / "schema.snapshot.vnext.json").read_bytes()
        ).hexdigest()[:16],
    }

    regression_meta = {
        "schema_hash": schema_hash,
        "version_label": label,
        "lineage_hashes": lineage_hashes,
        "regression_notes": [],
        "assistant_notes": ["Histórico incremental; diff via runtime_artifact_diffing_stub."],
    }
    reg_path = history / "registry.jsonl"
    with reg_path.open("a", encoding="utf-8") as fh:
        fh.write(json.dumps(regression_meta, sort_keys=True) + "\n")

    incremental_manifest = {
        "artifact_version": meta["artifact_version"],
        "schema_hash": schema_hash,
        "version_label": label,
        "lineage_hashes": lineage_hashes,
        "compatibility_summary": meta.get("compatibility_summary", {}),
        "assistant_notes": meta.get("assistant_notes", []),
    }
    (version_dir / "incremental.manifest.json").write_text(
        json.dumps(incremental_manifest, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )

    return {
        "version_label": label,
        "schema_hash": schema_hash,
        "history_path": str(version_dir),
        "lineage_hashes": lineage_hashes,
        "regression_metadata": regression_meta,
        "assistant_notes": [
            "runtime_artifact_registry: snapshot histórico; sem serviços externos.",
        ],
    }


def runtime_artifact_registry_stub(scope: str, *, storage_path: str | None = None) -> dict[str, Any]:
    return {
        "scope": scope,
        "storage_path": storage_path or str(HISTORY_ROOT),
        "assistant_notes": ["runtime_artifact_registry_stub: use register_runtime_artifact_history."],
        "deterministic_alignment": {"token": f"reg-{scope}"},
        "lineage_hints": {},
        "mobile_runtime_hints": {},
    }
