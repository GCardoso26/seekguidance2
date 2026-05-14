"""Merge de políticas cross-version."""

from __future__ import annotations

from typing import Any


def cross_version_merge_stub(v_old: str, v_new: str) -> dict[str, Any]:
    return {
        "from_version": v_old,
        "to_version": v_new,
        "merge_status": "lineage_tracked",
        "assistant_notes": ["Supersedência temporal deve acompanhar replay e corpus snapshots."],
    }
