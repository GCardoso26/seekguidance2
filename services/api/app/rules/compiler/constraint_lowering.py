"""Lowering de constraints para forma canónica."""

from __future__ import annotations

from copy import deepcopy

from app.rules.ir.rule_ir_models import RuleIRDocument


def lower_constraints(doc: RuleIRDocument) -> RuleIRDocument:
    d = deepcopy(doc)
    d.precedence_constraints = sorted(set(d.precedence_constraints))
    d.metadata["constraint_lowering"] = True
    return d
