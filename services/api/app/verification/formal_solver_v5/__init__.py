"""Formal solver V5 — evolução incremental (explainability-first, sem CNF bruto)."""

from app.verification.formal_solver_v5.apnap_solver import apnap_solver_payload
from app.verification.formal_solver_v5.bounded_multiplayer_search import bounded_multiplayer_search_payload
from app.verification.formal_solver_v5.combat_chain_legality import combat_chain_legality_v5_payload
from app.verification.formal_solver_v5.cross_runtime_legality import cross_runtime_legality_v5_payload
from app.verification.formal_solver_v5.deterministic_timing_alignment import deterministic_timing_alignment_payload
from app.verification.formal_solver_v5.distributed_legality_runtime import distributed_legality_runtime_payload
from app.verification.formal_solver_v5.hidden_dependency_resolution import hidden_dependency_resolution_v5_payload
from app.verification.formal_solver_v5.incremental_z3_runtime import incremental_z3_runtime_payload
from app.verification.formal_solver_v5.proof_graph_generation import proof_graph_generation_payload
from app.verification.formal_solver_v5.replacement_fixedpoint_runtime import replacement_fixedpoint_runtime_payload
from app.verification.formal_solver_v5.segoc_formal_validation import segoc_formal_validation_payload
from app.verification.formal_solver_v5.solver_branch_caps import solver_branch_caps_payload
from app.verification.formal_solver_v5.solver_replay_alignment import solver_replay_alignment_v5_payload
from app.verification.formal_solver_v5.solver_timeout_safeguards import solver_timeout_safeguards_v5_payload
from app.verification.formal_solver_v5.temporal_legality_solver import temporal_legality_solver_payload
from app.verification.formal_solver_v5.unsat_semantic_reasoning import unsat_semantic_reasoning_payload

__all__ = [
    "apnap_solver_payload",
    "bounded_multiplayer_search_payload",
    "combat_chain_legality_v5_payload",
    "cross_runtime_legality_v5_payload",
    "deterministic_timing_alignment_payload",
    "distributed_legality_runtime_payload",
    "hidden_dependency_resolution_v5_payload",
    "incremental_z3_runtime_payload",
    "proof_graph_generation_payload",
    "replacement_fixedpoint_runtime_payload",
    "segoc_formal_validation_payload",
    "solver_branch_caps_payload",
    "solver_replay_alignment_v5_payload",
    "solver_timeout_safeguards_v5_payload",
    "temporal_legality_solver_payload",
    "unsat_semantic_reasoning_payload",
]
