"""Pipeline: StructuredRule → RuleIRDocument."""

from __future__ import annotations

from typing import Any, get_args

from app.rules.compiler.constraint_lowering import lower_constraints
from app.rules.compiler.dependency_expansion import expand as dep_expand
from app.rules.compiler.ir_optimizer import optimize
from app.rules.compiler.ir_validator import validate
from app.rules.compiler.mutation_expansion import expand_mutations
from app.rules.compiler.semantic_lowering import lower
from app.rules.ir.ir_builder import build_ir_from_structured
from app.rules.ir.rule_ir_models import RuleIRDocument
from app.rules.structured_rules import RuleType, StructuredRule


def structured_rule_from_dict(d: dict[str, Any]) -> StructuredRule:
    rt_raw = d.get("rule_type", "unknown")
    rt: RuleType = rt_raw if rt_raw in get_args(RuleType) else "unknown"
    return StructuredRule(
        rule_id=str(d["rule_id"]),
        game=str(d.get("game", "mtg")),
        rule_type=rt,
        timing_window=d.get("timing_window"),
        precedence=list(d.get("precedence") or []),
        dependencies=list(d.get("dependencies") or []),
        constraints=list(d.get("constraints") or []),
        state_effects=list(d.get("state_effects") or []),
        zone_effects=list(d.get("zone_effects") or []),
        interaction_semantics=list(d.get("interaction_semantics") or []),
        version_label=d.get("version_label"),
        raw_excerpt=d.get("raw_excerpt"),
    )


def compile_structured_rule(sr: StructuredRule) -> RuleIRDocument:
    doc = build_ir_from_structured(sr)
    doc = lower(doc)
    doc = dep_expand(doc)
    doc = expand_mutations(doc)
    doc = lower_constraints(doc)
    doc = optimize(doc)
    validate(doc)
    return doc


def compile_rule_dict(d: dict[str, Any]) -> RuleIRDocument:
    return compile_structured_rule(structured_rule_from_dict(d))
