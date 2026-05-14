"""Dimensões de parsing formal por TCG (heurísticas sobre `formal_parse`)."""

from __future__ import annotations

import re
from typing import Any

from tcg_judge_ingestion.parsing.formal_router import formal_parse
from tcg_judge_ingestion.parsing.structured_sections import extract_semantic_sections


def _kw(text: str, *words: str) -> list[str]:
    t = text.lower()
    return [w for w in words if w in t]


def extract_formal_dimensions(game_slug: str, text: str) -> dict[str, Any]:
    base = formal_parse(game_slug, text)
    t = text.lower()
    slots = dict(base.get("formal_slots") or {})
    slots["semantic_sections"] = extract_semantic_sections(text)
    slots["triggers"] = _kw(text, "trigger", "activated", "when")
    slots["zone_transitions"] = _kw(text, "graveyard", "exile", "battlefield", "banish", "field")
    slots["state_based_actions"] = _kw(text, "state-based", "704", "sba")
    slots["layers_continuous"] = _kw(text, "layer", "continuous", "613", "modifier")
    slots["apnap"] = _kw(text, "apnap", "active player", "non-active")
    slots["segoc"] = _kw(text, "segoc", "simultaneous")
    slots["continuous_effects"] = _kw(text, "continuous effect", "static ability")
    if game_slug == "yugioh":
        slots.setdefault("chain_stack", base.get("chain_stack_semantics", []))
    if game_slug == "mtg":
        slots.setdefault("replacement", base.get("replacement_semantics", []))
    slots["dependency_hints"] = bool(re.search(r"\bdepends on\b|\bif\b.*\bthen\b", t))
    return {**base, "formal_slots": slots, "game_slug": game_slug}
