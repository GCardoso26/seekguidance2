"""Merge temporal de ramos."""

from __future__ import annotations

from app.runtime.explosion_control_v2.temporal_branch_compaction import temporal_branch_compaction


def temporal_branch_merge(branches: list[tuple[int, str]]) -> list[tuple[int, str]]:
    return temporal_branch_compaction(branches)
