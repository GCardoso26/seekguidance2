"""Abstrações semânticas universais (capacidades por TCG, sem forçar modelo errado)."""

from app.games.normalization.cross_game_equivalence.equivalence_engine import equivalence_hint
from app.games.normalization.interaction_models.edges import InteractionEdge, default_edges
from app.games.normalization.ontology_mapping.map_registry import ontology_for_game
from app.games.normalization.reasoning_profiles.tuning import retrieval_tuning
from app.games.normalization.semantic_alignment.cross_tcg_bridge import describe_cross_tcg_bridge
from app.games.normalization.timing_profiles.windows import timing_labels
from app.games.normalization.universal import (
    SemanticSubsystem,
    game_semantic_capabilities,
)

__all__ = [
    "SemanticSubsystem",
    "default_edges",
    "describe_cross_tcg_bridge",
    "equivalence_hint",
    "game_semantic_capabilities",
    "InteractionEdge",
    "ontology_for_game",
    "retrieval_tuning",
    "timing_labels",
]
