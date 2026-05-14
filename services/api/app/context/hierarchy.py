"""Agrupamento hierárquico para assembly: pais → atómicos → siblings."""

from __future__ import annotations

from dataclasses import dataclass, field

from app.retrieval.types import ChunkHit


@dataclass
class HierarchyBundle:
    parents: list[ChunkHit] = field(default_factory=list)
    atomic: list[ChunkHit] = field(default_factory=list)
    siblings: list[ChunkHit] = field(default_factory=list)


def group_hits_for_assembly(hits: list[ChunkHit]) -> HierarchyBundle:
    """Separa por `expansion_source` e nível hierárquico sem alterar scores relativos."""
    parents: list[ChunkHit] = []
    atomic: list[ChunkHit] = []
    siblings: list[ChunkHit] = []
    for h in sorted(hits, key=lambda x: (-x.effective_score, x.hierarchy_level)):
        if h.expansion_source == "parent":
            parents.append(h)
        elif h.expansion_source == "sibling":
            siblings.append(h)
        else:
            atomic.append(h)
    parents.sort(key=lambda x: (x.hierarchy_level, x.rule_path or ""))
    atomic.sort(key=lambda x: (-x.effective_score, x.rule_path or ""))
    siblings.sort(key=lambda x: (-x.effective_score, x.rule_path or ""))
    return HierarchyBundle(parents=parents, atomic=atomic, siblings=siblings)
