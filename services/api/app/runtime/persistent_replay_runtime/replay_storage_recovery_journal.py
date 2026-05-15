"""replay_storage_recovery_journal — journal de recovery filesystem/sqlite."""

from __future__ import annotations

import json
import time
from pathlib import Path
from typing import Any

from app.runtime.persistent_replay_runtime.sqlite_snapshot_store import default_sqlite_store_root


def append_recovery_journal(
    replay_ref: str,
    step: str,
    *,
    storage_path: str | None = None,
) -> dict[str, Any]:
    root = Path(storage_path) if storage_path else default_sqlite_store_root()
    journal_dir = root / "recovery_journal"
    journal_dir.mkdir(parents=True, exist_ok=True)
    now = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    entry = {"replay_ref": replay_ref, "step": step, "at": now}
    journal_file = journal_dir / f"{replay_ref}.jsonl"
    with journal_file.open("a", encoding="utf-8") as fh:
        fh.write(json.dumps(entry, sort_keys=True) + "\n")
    return {
        "storage_path": str(root),
        "replay_ref": replay_ref,
        "recovery_steps": [entry],
        "assistant_notes": ["append_recovery_journal: journal append-only."],
        "integrity_status": {"ok": True},
        "deterministic_alignment": {"token": f"jrn-{replay_ref}"},
    }


def replay_storage_recovery_journal_stub(scope: str, *, storage_path: str | None = None) -> dict[str, Any]:
    return {
        "scope": scope,
        "storage_path": storage_path or str(default_sqlite_store_root()),
        "assistant_notes": ["replay_storage_recovery_journal_stub: use append_recovery_journal."],
        "recovery_steps": [],
        "integrity_status": {"ok": True},
        "deterministic_alignment": {"token": f"jrn-{scope}"},
    }
