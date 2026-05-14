"""Diff semântico entre duas versões de regra."""

from __future__ import annotations


def semantic_rule_diff(old: dict[str, object], new: dict[str, object]) -> dict[str, object]:
    changed = old != new
    return {"semantic_behavior_change": changed, "changed_keys": sorted(set(old.keys()) ^ set(new.keys()))}
