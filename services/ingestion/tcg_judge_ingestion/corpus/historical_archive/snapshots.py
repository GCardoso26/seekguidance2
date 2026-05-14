"""Arquivo histórico + reconstrução de snapshots."""

from __future__ import annotations

from typing import Any


def snapshot_reconstruction_stub(*, version_label: str, content_hash: str) -> dict[str, Any]:
    return {
        "version_label": version_label,
        "content_hash": content_hash,
        "reconstructed": True,
        "mode": "stub",
    }


def document_time_travel_index(versions: list[str]) -> dict[str, Any]:
    return {"versions": versions, "ordered": list(sorted(versions))}
