"""Consistência entre cadeia determinística e simulação simbólica."""

from __future__ import annotations


def symbolic_consistency_score(
    validated_chain_len: int,
    symbolic_transitions: int,
) -> float:
    if validated_chain_len <= 0:
        return 0.0
    if symbolic_transitions <= 0:
        return 0.3
    ratio = min(1.0, symbolic_transitions / max(1, validated_chain_len))
    return round(0.5 + 0.5 * ratio, 4)
