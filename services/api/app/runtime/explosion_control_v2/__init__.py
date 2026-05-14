"""Explosion control V2/V3 — pruning adaptativo (incremental; não substitui V1 caps)."""

from app.runtime.explosion_control_v2.adaptive_graph_collapse import adaptive_graph_collapse
from app.runtime.explosion_control_v2.adaptive_pruning_engine import adaptive_prune_decision
from app.runtime.explosion_control_v2.convergence_prediction import convergence_prediction
from app.runtime.explosion_control_v2.graph_entropy_control import graph_entropy_pressure
from app.runtime.explosion_control_v2.ontology_divergence_pruning import ontology_prune_hint
from app.runtime.explosion_control_v2.ontology_entropy_limits import ontology_entropy_limits
from app.runtime.explosion_control_v2.replay_compaction import compact_replay_hashes
from app.runtime.explosion_control_v2.replay_entropy_bounds import replay_entropy_bounds
from app.runtime.explosion_control_v2.semantic_branch_limiter import semantic_branch_limit
from app.runtime.explosion_control_v2.semantic_divergence_prediction import semantic_divergence_prediction
from app.runtime.explosion_control_v2.symbolic_path_collapse import collapse_symbolic_paths
from app.runtime.explosion_control_v2.temporal_branch_compaction import temporal_branch_compaction
from app.runtime.explosion_control_v2.temporal_drift_bounds import temporal_drift_bound

__all__ = [
    "adaptive_graph_collapse",
    "adaptive_prune_decision",
    "collapse_symbolic_paths",
    "compact_replay_hashes",
    "convergence_prediction",
    "graph_entropy_pressure",
    "ontology_entropy_limits",
    "ontology_prune_hint",
    "replay_entropy_bounds",
    "semantic_branch_limit",
    "semantic_divergence_prediction",
    "temporal_branch_compaction",
    "temporal_drift_bound",
]
