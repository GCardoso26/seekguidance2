"""Hooks SAT mínimos (DPLL-like apenas para cláusulas unitárias)."""

from __future__ import annotations

from typing import Any


def unit_propagation(clauses: list[list[str]]) -> dict[str, Any]:
    """`clauses` lista de disjunções de literais ('a' ou '!a')."""
    assignment: dict[str, bool] = {}
    changed = True
    while changed:
        changed = False
        for cl in clauses:
            unassigned = [lit for lit in cl if (lit.lstrip("!") not in assignment)]
            if len(unassigned) == 1:
                lit = unassigned[0]
                neg = lit.startswith("!")
                name = lit[1:] if neg else lit
                assignment[name] = not neg
                changed = True
    return {"assignment": assignment, "clauses_remaining": clauses}
