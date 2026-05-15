"""Materialização de artefatos runtime (OpenAPI, manifests, integridade)."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any

from app.api.openapi_runtime_real.export_openapi_json import export_openapi_json

ARTIFACT_ROOT = (
    Path(__file__).resolve().parents[3] / "generated" / "runtime_artifacts"
)


def _sha256_file(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def materialize_runtime_artifacts(
    root: Path | None = None,
) -> dict[str, Any]:
    """Gera openapi, manifest, snapshot e integrity em runtime_artifacts/."""
    root = root or ARTIFACT_ROOT
    openapi_dir = root / "openapi"
    manifests_dir = root / "manifests"
    snapshots_dir = root / "snapshots"
    lineage_dir = root / "lineage"
    integrity_dir = root / "integrity"
    ci_dir = root / "ci"
    for d in (
        openapi_dir,
        manifests_dir,
        snapshots_dir,
        lineage_dir,
        integrity_dir,
        ci_dir,
    ):
        d.mkdir(parents=True, exist_ok=True)

    openapi_path = openapi_dir / "openapi.runtime.vnext.json"
    export_meta = export_openapi_json(openapi_path)
    schema_hash = export_meta["route_hash"]

    manifest = {
        "artifact_version": "runtime-vnext",
        "schema_hash": schema_hash,
        "compatibility_summary": export_meta.get("compatibility_hints", {}),
        "lineage_summary": {"reasoning_v1_v11": "preserved"},
        "assistant_notes": [
            "runtime.manifest.vnext: versionado para CI incremental.",
        ],
    }
    manifest_path = manifests_dir / "runtime.manifest.vnext.json"
    manifest_path.write_text(json.dumps(manifest, indent=2, sort_keys=True) + "\n", encoding="utf-8")

    snapshot = {
        "schema_hash": schema_hash,
        "openapi_path": str(openapi_path.relative_to(root)),
        "assistant_notes": ["schema.snapshot.vnext: contrato congelado para diff CI."],
    }
    snapshot_path = snapshots_dir / "schema.snapshot.vnext.json"
    snapshot_path.write_text(json.dumps(snapshot, indent=2, sort_keys=True) + "\n", encoding="utf-8")

    lineage_hint = {
        "manifest_hash": hashlib.sha256(manifest_path.read_bytes()).hexdigest()[:16],
        "snapshot_hash": hashlib.sha256(snapshot_path.read_bytes()).hexdigest()[:16],
    }
    lineage_path = lineage_dir / "runtime.lineage.vnext.json"
    lineage_path.write_text(json.dumps(lineage_hint, indent=2) + "\n", encoding="utf-8")

    integrity = {
        "schema_hash": schema_hash,
        "artifact_version": "runtime-vnext",
        "files": {
            "openapi": _sha256_file(openapi_path),
            "manifest": _sha256_file(manifest_path),
            "snapshot": _sha256_file(snapshot_path),
        },
        "assistant_notes": ["runtime.integrity.vnext: hashes para validação CI."],
    }
    integrity_path = integrity_dir / "runtime.integrity.vnext.json"
    integrity_path.write_text(json.dumps(integrity, indent=2, sort_keys=True) + "\n", encoding="utf-8")

    ci_manifest = {
        "schema_hash": schema_hash,
        "integrity_path": str(integrity_path.relative_to(root)),
        "assistant_notes": ["runtime.ci.vnext: enforcement incremental pilot v5."],
    }
    ci_path = ci_dir / "runtime.ci.vnext.json"
    ci_path.write_text(json.dumps(ci_manifest, indent=2, sort_keys=True) + "\n", encoding="utf-8")

    return {
        "artifact_root": str(root),
        "schema_hash": schema_hash,
        "artifact_version": "runtime-vnext",
        "paths": {
            "openapi": str(openapi_path),
            "manifest": str(manifest_path),
            "snapshot": str(snapshot_path),
            "lineage": str(lineage_path),
            "integrity": str(integrity_path),
            "ci": str(ci_path),
        },
        "compatibility_summary": manifest["compatibility_summary"],
        "lineage_summary": manifest["lineage_summary"],
        "assistant_notes": [
            "openapi_runtime_materializer: artefatos reais; sem SDK auto-gen.",
        ],
    }


def openapi_runtime_materializer_stub() -> dict[str, Any]:
    return materialize_runtime_artifacts()
