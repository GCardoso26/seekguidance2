"""Diff de replay cross-version."""

from __future__ import annotations

from typing import Any


def cross_version_replay_diff_stub(v_old: str, v_new: str) -> dict[str, Any]:
    return {"from": v_old, "to": v_new, "assistant_notes": ["Policy lineage e supersession."]}
