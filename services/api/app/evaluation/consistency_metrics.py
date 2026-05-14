"""Métricas agregadas de consistência (benchmark)."""

from __future__ import annotations


def ordering_match_score(expected: list[str], actual: list[str]) -> float:
    if not expected:
        return 1.0 if not actual else 0.5
    exp_set = [x.strip().lower() for x in expected]
    act_set = [x.strip().lower() for x in actual]
    hits = sum(1 for e in exp_set if any(e in a or a in e for a in act_set))
    return hits / max(1, len(exp_set))


def conflict_type_recall(expected_types: list[str], detected: list[dict]) -> float:
    if not expected_types:
        return 1.0
    found = {d.get("type", "") for d in detected}
    return sum(1 for t in expected_types if t in found) / max(1, len(expected_types))
