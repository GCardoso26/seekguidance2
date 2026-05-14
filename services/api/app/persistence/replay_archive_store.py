"""Arquivo de replays (blobs versionados)."""

from __future__ import annotations

from typing import Any


class ReplayArchiveStore:
    def __init__(self) -> None:
        self._archives: list[dict[str, Any]] = []

    def push(self, *, replay_hash: str, version_label: str, payload: dict[str, Any]) -> None:
        self._archives.append(
            {"replay_hash": replay_hash, "version_label": version_label, "payload": dict(payload)}
        )

    def list_recent(self, limit: int = 16) -> list[dict[str, Any]]:
        return list(reversed(self._archives[-limit:]))
