"""Relações entre nós IR."""

from __future__ import annotations

from typing import Any


def precedence_edge(from_rule: str, to_rule: str, relation: str = "must_precede") -> dict[str, Any]:
    return {"from_rule": from_rule, "to_rule": to_rule, "relation": relation}


def dependency_edge(effect_id: str, depends_on: str) -> dict[str, Any]:
    return {"effect": effect_id, "depends_on": depends_on}
