"""Arquivos históricos de juiz / policy (declarativo — URLs reais fora do repo)."""

from __future__ import annotations

from typing import Any, Literal

ArchiveKind = Literal[
    "historical_ruling",
    "judge_forum",
    "release_notes",
    "errata_history",
    "policy_delta",
    "tournament_ruling",
    "faq_revision",
    "archived_pdf",
    "policy_snapshot",
    "gameplay_clarification",
]


def archive_intents_for_game(game_slug: str) -> list[dict[str, Any]]:
    g = game_slug.lower()
    base: list[ArchiveKind] = [
        "historical_ruling",
        "judge_forum",
        "release_notes",
        "errata_history",
        "policy_delta",
        "tournament_ruling",
        "faq_revision",
        "archived_pdf",
        "policy_snapshot",
        "gameplay_clarification",
    ]
    priority = {"yugioh": 1.0, "fab": 0.98, "pokemon": 0.96, "onepiece": 0.95, "digimon": 0.94}.get(g, 0.9)
    return [{"game": g, "kind": k, "priority": priority} for k in base]
