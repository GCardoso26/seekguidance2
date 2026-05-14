"""Formal solver V6 — explainability operacional (sem CNF bruto)."""

from app.verification.formal_solver_v6.apnap_formal_runtime import apnap_formal_runtime_payload
from app.verification.formal_solver_v6.bounded_multiplayer_solver import bounded_multiplayer_solver_payload
from app.verification.formal_solver_v6.combat_chain_legality_runtime import combat_chain_legality_runtime_payload
from app.verification.formal_solver_v6.cross_runtime_legality_analysis import cross_runtime_legality_analysis_payload
from app.verification.formal_solver_v6.deterministic_solver_alignment import deterministic_solver_alignment_v6_payload
from app.verification.formal_solver_v6.distributed_solver_runtime import distributed_solver_runtime_payload
from app.verification.formal_solver_v6.hidden_dependency_resolution_v2 import hidden_dependency_resolution_v2_payload
from app.verification.formal_solver_v6.incremental_solver_sessions import incremental_solver_sessions_payload
from app.verification.formal_solver_v6.operational_legality_runtime import operational_legality_runtime_payload
from app.verification.formal_solver_v6.proof_graph_runtime import proof_graph_runtime_payload
from app.verification.formal_solver_v6.replacement_fixedpoint_runtime_v2 import (
    replacement_fixedpoint_runtime_v2_payload,
)
from app.verification.formal_solver_v6.runtime_solver_safeguards import runtime_solver_safeguards_payload
from app.verification.formal_solver_v6.segoc_runtime_validation import segoc_runtime_validation_payload
from app.verification.formal_solver_v6.semantic_unsat_analysis import semantic_unsat_analysis_v6_payload
from app.verification.formal_solver_v6.solver_replay_consistency import solver_replay_consistency_payload
from app.verification.formal_solver_v6.solver_stability_runtime import solver_stability_runtime_payload
from app.verification.formal_solver_v6.solver_timeout_governance import solver_timeout_governance_payload
from app.verification.formal_solver_v6.temporal_legality_proofs import temporal_legality_proofs_payload

__all__ = [
    "apnap_formal_runtime_payload",
    "bounded_multiplayer_solver_payload",
    "combat_chain_legality_runtime_payload",
    "cross_runtime_legality_analysis_payload",
    "deterministic_solver_alignment_v6_payload",
    "distributed_solver_runtime_payload",
    "hidden_dependency_resolution_v2_payload",
    "incremental_solver_sessions_payload",
    "operational_legality_runtime_payload",
    "proof_graph_runtime_payload",
    "replacement_fixedpoint_runtime_v2_payload",
    "runtime_solver_safeguards_payload",
    "semantic_unsat_analysis_v6_payload",
    "segoc_runtime_validation_payload",
    "solver_replay_consistency_payload",
    "solver_stability_runtime_payload",
    "solver_timeout_governance_payload",
    "temporal_legality_proofs_payload",
]
