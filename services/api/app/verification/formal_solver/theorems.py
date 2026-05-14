"""Verificações de teorema / satisfiabilidade de alto nível (sobre IR stub)."""

from __future__ import annotations

from typing import Any

from app.verification.formal_solver.compiler import compile_legality_ir, compile_timing_ir, verify_compiled


def legality_theorem_stub(flags: dict[str, bool]) -> dict[str, Any]:
    ir = compile_legality_ir(flags)
    return verify_compiled(ir)


def timing_theorem_stub(windows: dict[str, bool]) -> dict[str, Any]:
    ir = compile_timing_ir(windows)
    return verify_compiled(ir)


def precedence_satisfiability_stub(ordered: list[str], blocked: set[str]) -> dict[str, Any]:
    """Ordem linear simples: nenhum elemento bloqueado pode preceder um não-bloqueado."""
    bad = [x for x in ordered if x in blocked]
    return {"sat": len(bad) == 0, "blocked_hits": bad}


def dependency_satisfiability_stub(edges: list[tuple[str, str]]) -> dict[str, Any]:
    """Deteção de ciclo orientado (DFS com conjunto de caminho)."""
    adj: dict[str, list[str]] = {}
    for a, b in edges:
        adj.setdefault(a, []).append(b)
    nodes = set(adj) | {b for _a, b in edges}
    path: set[str] = set()
    visited: set[str] = set()

    def has_cycle_from(u: str) -> bool:
        if u in path:
            return True
        if u in visited:
            return False
        path.add(u)
        for v in adj.get(u, []):
            if has_cycle_from(v):
                return True
        path.remove(u)
        visited.add(u)
        return False

    for n in sorted(nodes):
        if n not in visited and has_cycle_from(n):
            return {"sat": False, "reason": "cycle"}
    return {"sat": True, "reason": "acyclic_stub"}
