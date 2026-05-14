"""Constrói RuleIRDocument a partir de StructuredRule."""

from __future__ import annotations

from typing import Any

from app.rules.ir.ir_mutations import mutation_template
from app.rules.ir.ir_nodes import condition_node
from app.rules.ir.rule_ir_models import RuleIRDocument
from app.rules.structured_rules import StructuredRule


def build_ir_from_structured(sr: StructuredRule) -> RuleIRDocument:
    conditions: list[dict[str, Any]] = [condition_node("rule_applies", {"rule_id": sr.rule_id})]
    timing_windows: list[str] = []
    if sr.timing_window:
        timing_windows.append(sr.timing_window)
    mutations: list[dict[str, Any]] = []
    for se in sr.state_effects:
        mutations.append(
            mutation_template("state_effect", "game", sr.rule_id, layer=None, new_value=se)
        )
    gen_events = [f"{sr.rule_type}_resolution"]
    meta = {"game": sr.game, "source": "structured_rule"}
    if sr.version_label:
        meta["version_label"] = sr.version_label
    return RuleIRDocument(
        rule_id=sr.rule_id,
        rule_type=sr.rule_type,
        conditions=conditions,
        timing_windows=timing_windows,
        precedence_constraints=list(sr.precedence),
        mutations=mutations,
        continuous_effects=[c for c in sr.constraints if "continuous" in c.lower() or "613" in c],
        dependencies=list(sr.dependencies),
        state_requirements=list(sr.zone_effects),
        generated_events=gen_events,
        metadata=meta,
    )

