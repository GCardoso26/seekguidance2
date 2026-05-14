"""Validação estrutural de grafos de prova (pré-condição para certificação)."""

from __future__ import annotations

from app.verification.formal_proofs.proof_graph import ProofGraph


def validate_proof_graph(graph: ProofGraph) -> dict[str, bool]:
    ids = {n.node_id for n in graph.nodes}
    ok_edges = all(a in ids and b in ids for a, b, _ in graph.edges)
    return {"valid": bool(ids) and ok_edges, "node_count": len(ids)}
