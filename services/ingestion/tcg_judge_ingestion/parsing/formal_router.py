"""Parsing formal multi-TCG (camada acima de `parsers/`)."""

from __future__ import annotations

from typing import Any

from tcg_judge_ingestion.parsers.registry import extract_for_game
from tcg_judge_ingestion.parsing.structured_sections import extract_semantic_sections


def formal_parse(game_slug: str, text: str) -> dict[str, Any]:
    """Agrega sinais heurísticos + slots para extração formal futura."""
    base = extract_for_game(game_slug, text)
    return {
        **base,
        "formal_slots": {
            "timing": base.get("timing", []),
            "precedence": base.get("windows", []),
            "replacement": base.get("replacement_semantics", []),
            "chain_stack": base.get("chain_stack_semantics", []),
            "tournament": base.get("tournament_procedures", []),
            "penalties": base.get("policy_infractions", []),
            "semantic_sections": extract_semantic_sections(text),
        },
    }
