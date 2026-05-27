"""Validação de paths para restore/backup (anti path traversal)."""

from __future__ import annotations

from pathlib import Path

_BACKUP_ROOT = Path("generated/runtime_artifacts/runtime_backup_v1")


def resolve_allowed_backup_path(backup_path: str) -> Path | None:
    if not backup_path or not backup_path.strip():
        return None
    try:
        src = Path(backup_path).expanduser().resolve(strict=False)
        root = _BACKUP_ROOT.resolve()
        src.relative_to(root)
    except (ValueError, OSError):
        return None
    manifest = src / "manifest.json"
    if not manifest.is_file():
        return None
    return src
