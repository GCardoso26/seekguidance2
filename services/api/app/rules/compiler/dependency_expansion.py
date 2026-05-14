"""Expansão de dependências transitivas (bounded)."""

from __future__ import annotations

from copy import deepcopy

from app.rules.ir.rule_ir_models import RuleIRDocument

MAX_DEP_DEPTH = 8


def expand(doc: RuleIRDocument) -> RuleIRDocument:
    d = deepcopy(doc)
    extra: list[str] = []
    for dep in d.dependencies[:MAX_DEP_DEPTH]:
        extra.append(f"ref::{dep}")
    d.dependencies = sorted(set(d.dependencies + extra))[: MAX_DEP_DEPTH * 2]
    d.metadata["dependency_expansion_depth_cap"] = MAX_DEP_DEPTH
    return d
