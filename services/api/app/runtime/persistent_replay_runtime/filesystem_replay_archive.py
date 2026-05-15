"""Arquivo JSON de replay em filesystem (leve, opcional)."""

from __future__ import annotations

import hashlib
import json
import os
import time
from collections.abc import Mapping
from pathlib import Path
from typing import Any


def default_filesystem_archive_root() -> Path:
    raw = os.environ.get("TCG_JUDGE_REPLAY_ARCHIVE_DIR", "")
    if raw:
        return Path(raw)
    return Path.cwd() / "var" / "replay_archive"


def _safe_segment(ref: str) -> str:
    return ref.replace("/", "_").replace("\\", "_")[:200]


def filesystem_archive_write(
    replay_ref: str,
    snapshot: Mapping[str, Any],
    *,
    root: Path | None = None,
) -> dict[str, Any]:
    root = root or default_filesystem_archive_root()
    target = root / _safe_segment(replay_ref)
    target.mkdir(parents=True, exist_ok=True)
    existing = sorted(
        (p for p in target.glob("v*.json") if not p.name.endswith(".meta.json")),
        key=lambda p: p.name,
    )
    version = len(existing) + 1
    path = target / f"v{version}.json"
    body = {
        "replay_ref": replay_ref,
        "version": version,
        "snapshot": dict(snapshot),
        "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }
    raw = json.dumps(body, sort_keys=True, separators=(",", ":")).encode("utf-8")
    integrity_hash = hashlib.sha256(raw).hexdigest()
    path.write_bytes(raw)
    meta = target / f"v{version}.meta.json"
    meta.write_text(
        json.dumps({"integrity_hash": integrity_hash}, separators=(",", ":")),
        encoding="utf-8",
    )
    return {
        "storage": "filesystem",
        "path": str(path),
        "version": version,
        "integrity_hash": integrity_hash,
        "replay_archive_metadata": {"format": "json_v1", "deterministic_sort_keys": True},
        "assistant_notes": ["filesystem_replay_archive: artefactos auditáveis pelo juiz."],
    }


def filesystem_archive_read_latest(replay_ref: str, *, root: Path | None = None) -> dict[str, Any] | None:
    root = root or default_filesystem_archive_root()
    target = root / _safe_segment(replay_ref)
    if not target.is_dir():
        return None
    files = sorted(
        (p for p in target.iterdir() if p.suffix == ".json" and not p.name.endswith(".meta.json")),
        key=lambda p: p.name,
    )
    if not files:
        return None
    path = files[-1]
    raw = path.read_bytes()
    data = json.loads(raw.decode("utf-8"))
    meta_path = path.with_name(path.stem + ".meta.json")
    expected = ""
    if meta_path.is_file():
        meta = json.loads(meta_path.read_text(encoding="utf-8"))
        expected = str(meta.get("integrity_hash", ""))
    got = hashlib.sha256(raw).hexdigest()
    data["integrity_ok"] = bool(expected) and expected == got
    return data
