"""Semântica profunda multi-TCG → rascunho compatível com `StructuredRule` (API)."""

from __future__ import annotations

import hashlib
import re
from typing import Any


def _rule_id_from(text: str) -> str:
    h = hashlib.sha256(text.encode("utf-8")).hexdigest()[:16]
    return f"ingest::{h}"


def _timing_from_game(game_slug: str, text: str) -> list[str]:
    t = text.lower()
    out: list[str] = []
    if game_slug == "mtg":
        if "apnap" in t or "a player" in t:
            out.append("apnap")
        if "stack" in t:
            out.append("stack_resolution")
        if "layer" in t:
            out.append("layer_system")
        if "replacement" in t or "instead" in t:
            out.append("replacement_effect")
    if game_slug == "yugioh":
        if "segoc" in t:
            out.append("segoc")
        if "chain" in t:
            out.append("chain_build")
        if "missed timing" in t:
            out.append("missed_timing")
    if game_slug == "fab":
        if "combat chain" in t or "chain link" in t:
            out.append("combat_chain_recursion")
    return out


def build_structured_rule_draft_v5(*, game_slug: str, text: str, base: dict[str, Any]) -> dict[str, Any]:
    """Gera dict consumível por `structured_rule_from_dict` na API."""
    rid = _rule_id_from(text)
    timing_extra = _timing_from_game(game_slug, text)
    rule_type = "unknown"
    if base.get("chain_stack_semantics"):
        rule_type = "chain_interaction"
    elif base.get("replacement_semantics"):
        rule_type = "replacement_effect"
    elif "trigger" in " ".join(base.get("trigger_semantics") or []):
        rule_type = "trigger_resolution"
    return {
        "rule_id": rid,
        "game": game_slug,
        "rule_type": rule_type,
        "timing_window": ",".join(timing_extra[:3]) or None,
        "precedence": list(base.get("windows") or [])[:6],
        "dependencies": list(base.get("dependencies") or [])[:8],
        "constraints": list(base.get("constraints") or [])[:8],
        "state_effects": list(base.get("state_transitions") or [])[:8],
        "zone_effects": [],
        "interaction_semantics": timing_extra + list(base.get("chain_stack_semantics") or [])[:4],
        "version_label": "structured_rule_draft_v5",
        "raw_excerpt": text[:400] or None,
    }


def enrich_parser_signals(game_slug: str, text: str, base: dict[str, Any]) -> dict[str, Any]:
    out = dict(base)
    out["deep_timing_semantics"] = _timing_from_game(game_slug, text)
    out["structured_rule_draft_v5"] = build_structured_rule_draft_v5(game_slug=game_slug, text=text, base=base)
    out["schema_hints"] = _schema_hints(game_slug, text)
    return out


def _schema_hints(game_slug: str, text: str) -> list[str]:
    t = text.lower()
    hints: list[str] = []
    if game_slug == "mtg" and re.search(r"\b704\b", t):
        hints.append("sba_recursion_risk")
    if game_slug == "yugioh" and "mandatory" in t and "optional" in t:
        hints.append("mandatory_optional_interleave")
    return hints
