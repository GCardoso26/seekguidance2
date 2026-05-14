"""Engine de dependências implícitas."""

from __future__ import annotations

from typing import Any

from app.rules.inference.causal_inference import infer_causal_relationships
from app.rules.inference.hidden_timing_dependencies import hidden_timing_dependencies
from app.rules.inference.procedural_inference import infer_procedural_dependencies
from app.rules.inference.semantic_relationship_inference import infer_semantic_relationships


def infer_implicit_dependencies(tokens: list[str]) -> dict[str, Any]:
    return {
        "implicit_dependencies": hidden_timing_dependencies(tokens),
        "causal_relationships": infer_causal_relationships(tokens),
        "procedural_dependencies": infer_procedural_dependencies(tokens),
        "semantic_relationships": infer_semantic_relationships(tokens),
    }
