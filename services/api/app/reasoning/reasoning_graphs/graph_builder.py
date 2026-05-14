"""Grafo leve de raciocínio: nós de interação e arestas de dependência / conflito."""

from __future__ import annotations

from typing import Any

from app.reasoning.types import ConflictItem, ExecutionStep


def build_reasoning_graph(
    steps: list[ExecutionStep],
    conflicts: list[ConflictItem],
    timing: dict[str, Any],
) -> dict[str, Any]:
    nodes: list[dict[str, Any]] = []
    for s in steps:
        nodes.append({"id": s.step_id, "kind": "interaction", "label": s.description})
    nodes.append({"id": "timing_context", "kind": "timing", "label": str(timing.get("window", ""))})

    edges: list[dict[str, Any]] = []
    for s in steps:
        for d in s.depends_on:
            edges.append({"source": d, "target": s.step_id, "edge_type": "execution_dependency"})
        edges.append({"source": "timing_context", "target": s.step_id, "edge_type": "timing_dependency"})

    for c in conflicts:
        if c.type == "replacement_precedence":
            edges.append(
                {
                    "source": "replacement",
                    "target": "sba",
                    "edge_type": "replacement_before_sba",
                    "severity": c.severity,
                }
            )
        elif "override" in c.type or c.type == "layer_dependency":
            edges.append(
                {
                    "source": c.rules[0] if c.rules else "rule_a",
                    "target": c.rules[-1] if len(c.rules) > 1 else "rule_b",
                    "edge_type": "override_or_dependency",
                    "severity": c.severity,
                }
            )
        else:
            edges.append(
                {
                    "source": "conflict",
                    "target": c.resolution_strategy,
                    "edge_type": "resolution_precedence",
                    "conflict_type": c.type,
                    "severity": c.severity,
                }
            )
    return {"nodes": nodes, "edges": edges}
