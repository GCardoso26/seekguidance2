"""Adapter SQLite leve para replay runtime (stdlib, opcional)."""

from __future__ import annotations

from collections.abc import Mapping
from pathlib import Path
from typing import Any

from app.runtime.persistent_replay_runtime.sqlite_snapshot_store import (
    sqlite_read_latest_snapshot,
    sqlite_write_snapshot,
)


def sqlite_replay_runtime_adapter_put(
    replay_ref: str,
    payload: Mapping[str, Any],
    *,
    root: Path | None = None,
) -> dict[str, Any]:
    meta = sqlite_write_snapshot(replay_ref, payload, root=root)
    return {
        "adapter": "sqlite",
        "replay_ref": replay_ref,
        "storage_meta": meta,
        "assistant_notes": ["sqlite_replay_runtime_adapter: persistência local opcional."],
    }


def sqlite_replay_runtime_adapter_get(
    replay_ref: str,
    *,
    root: Path | None = None,
) -> dict[str, Any] | None:
    row = sqlite_read_latest_snapshot(replay_ref, root=root)
    if row is None:
        return None
    return {
        "adapter": "sqlite",
        "replay_ref": replay_ref,
        "snapshot": row,
        "assistant_notes": ["Leitura incremental; juiz audita payload."],
    }


def sqlite_replay_runtime_adapter_stub(replay_ref: str) -> dict[str, Any]:
    put = sqlite_replay_runtime_adapter_put(replay_ref, {"layer": "adapter_stub"})
    return {"put": put, "replay_ref": replay_ref}
