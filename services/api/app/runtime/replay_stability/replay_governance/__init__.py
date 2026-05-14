"""Governança de replay (lineage + políticas assistentes)."""

from __future__ import annotations

from typing import Any


def replay_lineage_stub(replay_id: str, parents: list[str]) -> dict[str, Any]:
    return {
        "replay_id": replay_id,
        "parents": parents,
        "assistant_notes": ["Governança: lineage obrigatório para judge-grade CI."],
    }
