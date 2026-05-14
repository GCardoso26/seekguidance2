"""Composição semântica de documentos IR."""

from __future__ import annotations

from typing import Any

from app.rules.ir.rule_ir_models import RuleIRDocument


def compose_documents(docs: list[RuleIRDocument]) -> dict[str, Any]:
    if not docs:
        return {"merged_dependencies": [], "merged_precedence": [], "rule_ids": []}
    deps: list[str] = []
    preds: list[str] = []
    for d in docs:
        deps.extend(d.dependencies)
        preds.extend(d.precedence_constraints)
    return {
        "merged_dependencies": sorted(set(deps)),
        "merged_precedence": sorted(set(preds)),
        "rule_ids": [d.rule_id for d in docs],
    }
