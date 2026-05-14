"""Otimização determinística do IR (dedupe e ordenação estável)."""

from __future__ import annotations

from copy import deepcopy

from app.rules.ir.rule_ir_models import RuleIRDocument


def optimize(doc: RuleIRDocument) -> RuleIRDocument:
    d = deepcopy(doc)
    d.generated_events = sorted(set(d.generated_events))
    d.continuous_effects = sorted(set(d.continuous_effects))
    d.metadata["ir_optimized"] = True
    return d
