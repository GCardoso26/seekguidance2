"""Formal solver V3 — SMT/Z3 opcional, payloads explainability-first (assistente, não prova crua)."""

from app.verification.formal_solver_v3.deterministic_legality_proofs import legality_proof_payload
from app.verification.formal_solver_v3.hidden_dependency_resolution import hidden_dependency_hints
from app.verification.formal_solver_v3.multiplayer_legality_solver import multiplayer_legality_payload
from app.verification.formal_solver_v3.paradox_detection.paradox_v3 import paradox_certificate
from app.verification.formal_solver_v3.proof_generation.player_payloads import formal_explainability_bundle
from app.verification.formal_solver_v3.replacement_recursion_solver import replacement_recursion_payload
from app.verification.formal_solver_v3.timing_satisfiability.timing_checks import timing_certificate_stub
from app.verification.formal_solver_v3.z3_runtime.bridge import z3_deterministic_bridge

__all__ = [
    "formal_explainability_bundle",
    "hidden_dependency_hints",
    "legality_proof_payload",
    "multiplayer_legality_payload",
    "paradox_certificate",
    "replacement_recursion_payload",
    "timing_certificate_stub",
    "z3_deterministic_bridge",
]
