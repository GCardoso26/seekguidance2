"""Conflitos temporais de regras."""

from __future__ import annotations


def temporal_rule_conflict(effective_a: str, effective_b: str, same_topic: bool) -> bool:
    return same_topic and effective_a != effective_b
