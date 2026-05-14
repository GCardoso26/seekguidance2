"""Snapshots de regra / replay alignment (metadados leves)."""

from __future__ import annotations

from typing import Any


def build_rule_snapshot(*, game_slug: str, rule_paths: list[str], content_hashes: list[str]) -> dict[str, Any]:
    return {
        "game_slug": game_slug,
        "rule_paths": list(rule_paths),
        "content_hashes": list(content_hashes),
        "historical_replay_alignment": "pending_graph_worker",
    }
