"""Esquema de arestas inferidas (gameplay / timing) — serializável para JSON e Postgres metadata."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass
class InferredRuleEdge:
    """Aresta entre identificadores de regra (cabeçalho numérico CR, ex.: 614 -> 704)."""

    source_rule_id: str
    target_rule_id: str
    relationship_type: str
    confidence: float
    evidence: list[str] = field(default_factory=list)
    relationship_score: float = 0.0
    metadata: dict[str, Any] = field(default_factory=dict)

    def to_metadata_blob(self) -> dict[str, Any]:
        return {
            "confidence": self.confidence,
            "evidence": self.evidence,
            "relationship_score": self.relationship_score,
            **self.metadata,
        }
