"""Formal solver V2 — suporte ao assistente (diagnósticos jogáveis, não prova crua)."""

from app.verification.formal_solver_v2.dependency_solver import dependency_solver_assistant
from app.verification.formal_solver_v2.legality_constraint_encoding import encode_legality_for_assistant
from app.verification.formal_solver_v2.multiplayer_consistency_solver import multiplayer_consistency_assistant
from app.verification.formal_solver_v2.paradox_detector import paradox_assistant_hint
from app.verification.formal_solver_v2.precedence_solver import precedence_assistant
from app.verification.formal_solver_v2.replacement_loop_solver import replacement_loop_assistant
from app.verification.formal_solver_v2.smt_runtime_bridge import smt_bridge_status
from app.verification.formal_solver_v2.timing_constraint_encoding import encode_timing_for_assistant

__all__ = [
    "dependency_solver_assistant",
    "encode_legality_for_assistant",
    "encode_timing_for_assistant",
    "multiplayer_consistency_assistant",
    "paradox_assistant_hint",
    "precedence_assistant",
    "replacement_loop_assistant",
    "smt_bridge_status",
]
