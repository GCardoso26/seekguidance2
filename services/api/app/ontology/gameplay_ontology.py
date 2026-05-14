"""Engine de ontologia de gameplay cross-TCG."""

from __future__ import annotations

from typing import Any

from app.ontology.gameplay_relationships import relationships
from app.ontology.interaction_taxonomy import interaction_taxonomy
from app.ontology.ontology_registry import OntologyRegistry
from app.ontology.semantic_inheritance import inheritance_map
from app.ontology.timing_taxonomy import timing_taxonomy


def build_gameplay_ontology() -> dict[str, Any]:
    reg = OntologyRegistry()
    for node in interaction_taxonomy():
        reg.register(node, {"kind": "interaction"})
    for node in timing_taxonomy():
        reg.register(node, {"kind": "timing"})
    return {
        "ontology_nodes": sorted(reg.all_nodes().keys()),
        "semantic_relationships": relationships(),
        "inheritance": inheritance_map(),
        "cross_tcg_mappings": {
            "mtg": ["stack", "sba", "layers"],
            "ygo": ["chain", "priority_windows"],
            "pokemon": ["state_check", "timing_policy"],
        },
    }
