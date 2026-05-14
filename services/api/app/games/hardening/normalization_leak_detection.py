"""Deteção de leak de normalização (equivalência forte indesejada)."""

from __future__ import annotations


def normalization_leak_flags(*, universal_rule_applied_to_local: bool, hard_equivalence: bool) -> dict[str, object]:
    return {"leak_risk": universal_rule_applied_to_local or hard_equivalence}
