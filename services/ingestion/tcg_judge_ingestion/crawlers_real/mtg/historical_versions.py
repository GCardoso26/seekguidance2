"""Snapshots versionados."""
from __future__ import annotations

from typing import Any

GAME_SLUG = 'mtg'


def version_manifest_stub(version_label: str) -> dict[str, Any]:
    return {"game": GAME_SLUG, "version_label": version_label, "immutable": True}
