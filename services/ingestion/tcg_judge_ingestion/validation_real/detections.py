"""Deteções de qualidade massiva de corpus (heurísticas / stubs DB-free)."""

from __future__ import annotations

from typing import Any


def missing_rules_hint(expected_rule_paths: set[str], indexed_paths: set[str]) -> dict[str, Any]:
    missing = sorted(expected_rule_paths - indexed_paths)
    return {"missing_count": len(missing), "missing_sample": missing[:12]}


def broken_citation_stub(citation_uri: str | None, known_hosts: set[str]) -> dict[str, Any]:
    if not citation_uri:
        return {"broken": True, "reason": "empty_uri"}
    host = citation_uri.split("//")[-1].split("/")[0].lower() if "//" in citation_uri else ""
    return {"broken": host and host not in known_hosts, "host": host or None}


def duplicate_semantic_cluster_stub(embeddings_cosine: list[float], threshold: float = 0.97) -> dict[str, Any]:
    """Lista simples de pares acima do limiar (entrada já pré-computada)."""
    dups = [x for x in embeddings_cosine if x >= threshold]
    return {"high_similarity_pairs": len(dups), "threshold": threshold}


def corpus_completeness_estimate(coverage_ratios: dict[str, float]) -> float:
    if not coverage_ratios:
        return 0.0
    return round(sum(coverage_ratios.values()) / max(1, len(coverage_ratios)), 4)


def invalid_ontology_mapping_stub(edge: dict[str, Any], allowed_relations: set[str]) -> bool:
    return edge.get("relation") not in allowed_relations
