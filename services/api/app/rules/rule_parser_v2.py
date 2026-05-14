"""Parser estruturado V2 — extrai semântica extra para layers / contínuos / replacement."""

from __future__ import annotations

import re
from typing import Any

from app.rules.structured_rules import StructuredRule


def enrich_rule_structured(rule_path: str | None, game_slug: str, excerpt: str | None) -> dict[str, Any]:
    out: dict[str, Any] = {
        "layer_interactions": [],
        "continuous_effect_hints": [],
        "replacement_semantics": [],
        "timing_dependencies": [],
        "object_mutations": [],
        "state_mutations": [],
    }
    if not rule_path:
        return out
    rp = rule_path.strip()
    text = (excerpt or "").lower()
    if game_slug == "mtg":
        if rp.startswith("613"):
            out["layer_interactions"].append("continuous_layer_dependency")
            out["continuous_effect_hints"].append("613_continuous")
        if rp.startswith("614"):
            out["replacement_semantics"].append("modify_event_before_resolution")
        if rp.startswith("704"):
            out["state_mutations"].append("state_based_cleanup")
        if "instead" in text:
            out["replacement_semantics"].append("replacement_instead_template")
        if "timestamp" in text or "layer" in text:
            out["layer_interactions"].append("timestamp_or_layer_explicit_text")
    if re.search(r"\btrigger\b", text):
        out["timing_dependencies"].append("post_resolution_trigger_window")
    return out


def merge_into_structured_rule(base: StructuredRule, enrichment: dict[str, Any]) -> StructuredRule:
    sem = list(base.interaction_semantics)
    for k, vs in enrichment.items():
        if isinstance(vs, list) and vs:
            sem.append(f"parsed_v2:{k}")
    return StructuredRule(
        rule_id=base.rule_id,
        game=base.game,
        rule_type=base.rule_type,
        timing_window=base.timing_window,
        precedence=list(base.precedence),
        dependencies=list(base.dependencies),
        constraints=list(base.constraints) + [c for c in enrichment.get("continuous_effect_hints", []) if c],
        state_effects=list(base.state_effects),
        zone_effects=list(base.zone_effects),
        interaction_semantics=sem,
        version_label=base.version_label,
        raw_excerpt=base.raw_excerpt,
    )
