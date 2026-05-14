"""Construção de AST semântico (bounded depth)."""

from __future__ import annotations

from typing import Any

MAX_AST_DEPTH = 8


def build_rule_ast(normalized: dict[str, Any]) -> dict[str, Any]:
    tokens = list(normalized.get("tokens", []))
    nodes = [{"type": "token", "value": t, "depth": 1} for t in tokens[:128]]
    return {"root": "rule", "max_depth": MAX_AST_DEPTH, "nodes": nodes}
