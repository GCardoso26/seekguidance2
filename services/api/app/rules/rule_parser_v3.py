"""Parser estruturado V3 — mutações, scopes e triggers para IR."""

from __future__ import annotations

import re
from typing import Any

from app.rules.rule_parser_v2 import enrich_rule_structured
from app.rules.structured_rule_schema import formal_rule_record_from_enrichment


def enrich_rule_structured_v3(rule_path: str | None, game_slug: str, excerpt: str | None) -> dict[str, Any]:
    base = enrich_rule_structured(rule_path, game_slug, excerpt)
    text = (excerpt or "").lower()
    base.setdefault("mutation_semantics", [])
    base.setdefault("effect_scopes", [])
    base.setdefault("runtime_triggers", [])
    base.setdefault("event_generation_hints", [])
    base.setdefault("legality_assertions", [])
    if game_slug == "mtg":
        if re.search(r"\b(layer|613)\b", text):
            base["mutation_semantics"].append("continuous_layer_mutator")
            base["effect_scopes"].append("layer_continuous")
        if "instead" in text:
            base["mutation_semantics"].append("replacement_redirect_event")
            base["runtime_triggers"].append("replacement_window")
        if "whenever" in text or "at the beginning" in text:
            base["runtime_triggers"].append("trigger_pending")
        if "can't" in text or "cannot" in text:
            base["legality_assertions"].append("restriction_check")
        if "create" in text and "token" in text:
            base["event_generation_hints"].append("create_token_event")
    base["formal_rule_record"] = formal_rule_record_from_enrichment(
        rule_path=rule_path, game_slug=game_slug, excerpt=excerpt, enrichment=base
    )
    return base
