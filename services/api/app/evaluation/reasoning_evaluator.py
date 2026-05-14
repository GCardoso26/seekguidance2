"""Avalia um caso canónico contra saída do motor de raciocínio."""

from __future__ import annotations

from typing import Any

from app.evaluation.consistency_metrics import conflict_type_recall, ordering_match_score
from app.evaluation.interaction_accuracy import interaction_accuracy


def evaluate_case(case: dict[str, Any], report_dict: dict[str, Any]) -> dict[str, float]:
    chain = report_dict.get("interaction_chain") or []
    if isinstance(chain, list):
        chain_s = [str(x) for x in chain]
    else:
        chain_s = []
    exp_order = case.get("expected_ordering") or []
    if isinstance(exp_order, list):
        exp_order_s = [str(x) for x in exp_order]
    else:
        exp_order_s = []
    conflicts = report_dict.get("conflicts_detected") or []
    if not isinstance(conflicts, list):
        conflicts = []
    exp_types = case.get("expected_conflict_types") or []
    return {
        "ordering_score": ordering_match_score(exp_order_s, chain_s),
        "interaction_accuracy": interaction_accuracy(exp_order_s, chain_s),
        "conflict_recall": conflict_type_recall(exp_types, conflicts),
        "reasoning_confidence": float(report_dict.get("reasoning_confidence") or 0.0),
    }
