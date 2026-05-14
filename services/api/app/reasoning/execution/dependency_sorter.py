"""Ordenação topológica de passos com dependências (profundidade limitada)."""

from __future__ import annotations

from app.reasoning.types import ExecutionStep


def topological_sort(steps: list[ExecutionStep]) -> list[ExecutionStep]:
    if not steps:
        return []
    id_to = {s.step_id: s for s in steps}
    visited: set[str] = set()
    result: list[ExecutionStep] = []

    def visit(nid: str) -> None:
        if nid in visited:
            return
        visited.add(nid)
        s = id_to.get(nid)
        if s is None:
            return
        for d in s.depends_on:
            visit(d)
        result.append(s)

    for s in steps:
        visit(s.step_id)
    return result
