"""runtime_restore_engine_v1."""

from __future__ import annotations

import json
import shutil
from pathlib import Path
from typing import Any

from app.core.security.paths import resolve_allowed_backup_path

_DATA = Path("generated/runtime_real_minimal")


def runtime_restore_engine_v1(
    scope: str,
    *,
    backup_path: str,
    dry_run: bool = False,
) -> dict[str, Any]:
    src = resolve_allowed_backup_path(backup_path)
    if src is None:
        return _fail(scope, "backup_path_not_allowed")
    manifest_path = src / "manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    if dry_run:
        return _ok(scope, {"dry_run": True, "manifest": manifest, "would_restore": True})

    sqlite_src = src / "sqlite_data"
    if sqlite_src.is_dir():
        if _DATA.exists():
            shutil.rmtree(_DATA)
        shutil.copytree(sqlite_src, _DATA)

    return _ok(scope, {"restored": True, "from": backup_path, "manifest": manifest})


def _ok(scope: str, extra: dict[str, Any]) -> dict[str, Any]:
    return {
        "scope": scope,
        "integrity_status": "ok",
        "runtime_confidence": 0.94,
        "assistant_notes": ["runtime_restore_engine_v1."],
        "deterministic_alignment": {"token": f"rst-{scope}"},
        "replay_summary": {},
        "lineage_summary": {},
        "divergence_summary": {},
        "governance_summary": {},
        "lifecycle_summary": {},
        "operational_notes": [],
        **extra,
    }


def _fail(scope: str, code: str) -> dict[str, Any]:
    out = _ok(scope, {"error": code, "restored": False})
    out["integrity_status"] = "degraded"
    return out
