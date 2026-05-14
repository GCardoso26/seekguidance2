"""Expansão de mutações (bounded)."""

from __future__ import annotations

from copy import deepcopy

from app.rules.ir.rule_ir_models import RuleIRDocument

MAX_MUTATIONS = 48


def expand_mutations(doc: RuleIRDocument) -> RuleIRDocument:
    d = deepcopy(doc)
    d.mutations = d.mutations[:MAX_MUTATIONS]
    d.metadata["mutation_expansion_cap"] = MAX_MUTATIONS
    return d
