"""Nós IR elementares."""

from __future__ import annotations

from typing import Any, Literal

IRNodeKind = Literal["condition", "effect", "constraint", "mutation_template"]


def condition_node(pred: str, args: dict[str, Any] | None = None) -> dict[str, Any]:
    return {"kind": "condition", "predicate": pred, "args": dict(args or {})}


def effect_node(name: str, scope: str) -> dict[str, Any]:
    return {"kind": "effect", "name": name, "scope": scope}
