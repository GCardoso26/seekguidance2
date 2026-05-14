"""Formal solver V4 — motor de legalidade judge-grade (bounded, explainability-first)."""

from app.verification.formal_solver_v4.bounded_exhaustion import bounded_exhaustive_legality_stub
from app.verification.formal_solver_v4.bounded_multiplayer_proofs import bounded_multiplayer_proof_stub
from app.verification.formal_solver_v4.bounded_search_runtime import bounded_legality_search
from app.verification.formal_solver_v4.chain_legality_runtime import chain_legality_stub
from app.verification.formal_solver_v4.combat_chain_validation import combat_chain_validation_stub
from app.verification.formal_solver_v4.cross_runtime_legality import cross_runtime_legality_stub
from app.verification.formal_solver_v4.deterministic_solver_alignment import deterministic_solver_alignment_stub
from app.verification.formal_solver_v4.exhaustive_legality import legality_saturation_stub
from app.verification.formal_solver_v4.fab_legality_runtime import fab_combat_chain_legality_stub
from app.verification.formal_solver_v4.hidden_dependency_solver import hidden_dependency_resolution_stub
from app.verification.formal_solver_v4.incremental_smt import incremental_smt_legality_stub
from app.verification.formal_solver_v4.multiplayer_exhaustion import multiplayer_legality_exhaustion_stub
from app.verification.formal_solver_v4.multiplayer_legality import multiplayer_legality_certificate_stub
from app.verification.formal_solver_v4.proof_compression import compress_legality_proof
from app.verification.formal_solver_v4.proof_persistence import persist_legality_proof_stub
from app.verification.formal_solver_v4.proof_reduction import proof_reduction_stub
from app.verification.formal_solver_v4.replacement_fixedpoint import replacement_fixedpoint_stub
from app.verification.formal_solver_v4.replacement_recursion_bounds import replacement_recursion_bounds_stub
from app.verification.formal_solver_v4.replacement_recursion_runtime import replacement_recursion_bounded
from app.verification.formal_solver_v4.replay_legality_proofs import replay_legality_proofs_stub
from app.verification.formal_solver_v4.segoc_validation import segoc_validation_stub
from app.verification.formal_solver_v4.semantic_contradiction_runtime import semantic_contradiction_stub
from app.verification.formal_solver_v4.semantic_unsat_analysis import semantic_unsat_analysis_stub
from app.verification.formal_solver_v4.solver_replay_alignment import solver_replay_alignment_stub
from app.verification.formal_solver_v4.solver_runtime_control import solver_runtime_safeguards
from app.verification.formal_solver_v4.timing_exhaustion import timing_exhaustion_stub
from app.verification.formal_solver_v4.timing_fixedpoint_analysis import timing_fixedpoint_analysis_stub
from app.verification.formal_solver_v4.timing_proof_search import timing_proof_search_stub
from app.verification.formal_solver_v4.unsat_explainability_v2 import unsat_explainability_v2
from app.verification.formal_solver_v4.unsat_reasoning import unsat_explanation_payload
from app.verification.formal_solver_v4.yugioh_legality_runtime import yugioh_chain_legality_stub

__all__ = [
    "bounded_exhaustive_legality_stub",
    "bounded_legality_search",
    "bounded_multiplayer_proof_stub",
    "chain_legality_stub",
    "combat_chain_validation_stub",
    "compress_legality_proof",
    "cross_runtime_legality_stub",
    "deterministic_solver_alignment_stub",
    "fab_combat_chain_legality_stub",
    "hidden_dependency_resolution_stub",
    "incremental_smt_legality_stub",
    "legality_saturation_stub",
    "multiplayer_legality_certificate_stub",
    "multiplayer_legality_exhaustion_stub",
    "persist_legality_proof_stub",
    "proof_reduction_stub",
    "replay_legality_proofs_stub",
    "replacement_fixedpoint_stub",
    "replacement_recursion_bounds_stub",
    "replacement_recursion_bounded",
    "segoc_validation_stub",
    "semantic_contradiction_stub",
    "semantic_unsat_analysis_stub",
    "solver_replay_alignment_stub",
    "solver_runtime_safeguards",
    "timing_exhaustion_stub",
    "timing_fixedpoint_analysis_stub",
    "timing_proof_search_stub",
    "unsat_explainability_v2",
    "unsat_explanation_payload",
    "yugioh_chain_legality_stub",
]
