"""Lowering semântico do IR (normalização)."""

from __future__ import annotations

from copy import deepcopy

from app.rules.ir.rule_ir_models import RuleIRDocument


def lower(doc: RuleIRDocument) -> RuleIRDocument:
    d = deepcopy(doc)
    d.dependencies = sorted(set(d.dependencies))
    d.metadata["semantic_lowering"] = True
    return d
