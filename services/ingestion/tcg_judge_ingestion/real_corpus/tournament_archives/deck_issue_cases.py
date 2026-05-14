"""Casos típicos de deck (sideboard, contagem — flags heurísticas)."""

from __future__ import annotations

from typing import Any


def deck_issue_flags(decklist: dict[str, Any]) -> list[str]:
    issues: list[str] = []
    if decklist.get("main_count") not in (None, 60) and decklist.get("format") == "constructed_std":
        issues.append("main_count_unusual")
    if decklist.get("sideboard_count", 0) > 15:
        issues.append("sideboard_overflow")
    return sorted(set(issues))
