"""Vista formal JSON de regra (extração V3/V4 + campos vazios extensíveis)."""

from __future__ import annotations

from typing import Any


def formal_rule_record_from_enrichment(
    *,
    rule_path: str | None,
    game_slug: str,
    excerpt: str | None,
    enrichment: dict[str, Any],
) -> dict[str, Any]:
    rid = (rule_path or "").strip() or "unknown"
    text = (excerpt or "").lower()
    rtype = "unknown"
    if game_slug == "mtg":
        if rid.startswith("613"):
            rtype = "layer_continuous"
        elif rid.startswith("614"):
            rtype = "replacement_effect"
        elif rid.startswith("704"):
            rtype = "state_based_action"
        elif "stack" in text or "405" in rid:
            rtype = "stack_interaction"
    elif game_slug == "yugioh":
        rtype = "chain_interaction" if "chain" in text else "priority_timing"
    timing = None
    if enrichment.get("runtime_triggers"):
        timing = "derived_from_triggers"
    elif enrichment.get("timing_dependencies"):
        timing = "derived_from_timing_dependencies"
    return {
        "rule_id": rid.replace(".", "_"),
        "rule_path": rid,
        "rule_type": rtype,
        "timing_window": timing,
        "precedence": list(enrichment.get("layer_interactions") or [])[:8],
        "dependencies": list(enrichment.get("timing_dependencies") or [])[:8],
        "constraints": list(enrichment.get("legality_assertions") or [])[:8]
        + list(enrichment.get("continuous_effect_hints") or [])[:4],
        "state_effects": list(enrichment.get("state_mutations") or [])[:8],
        "interaction_semantics": list(enrichment.get("mutation_semantics") or [])[:12],
        "zones": [],
        "replacement_behavior": list(enrichment.get("replacement_semantics") or [])[:8],
        "trigger_behavior": list(enrichment.get("runtime_triggers") or [])[:8],
        "game_slug": game_slug,
    }
