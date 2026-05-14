"""Deteção de ciclos / precedência não totalizável no grafo must_precede."""

from __future__ import annotations

from typing import Any

from app.reasoning.deterministic.precedence_resolver import topological_role_order


def detect_circular_precedence(edges: list[tuple[str, str]]) -> list[dict[str, Any]]:
    nodes = sorted({x for e in edges for x in e})
    if not nodes:
        return []
    _, ok = topological_role_order(nodes, edges)
    if ok:
        return []
    return [
        {
            "type": "circular_precedence",
            "rules": nodes[:12],
            "severity": "critical",
            "reason": "must_precede edges do not admit a total order (cycle or deadlock).",
        }
    ]
