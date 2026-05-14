"""Estabilidade cross-TCG (deteção de pressão sem colapsar semânticas)."""

from app.games.stability.abstraction_leak_detector import detect_abstraction_leak_risk
from app.games.stability.cross_game_runtime_diff import runtime_diff_report
from app.games.stability.normalization_safety import soft_normalization_safe
from app.games.stability.semantic_boundary_checks import boundary_violation_flags
from app.games.stability.tcg_pressure_analysis import pressure_matrix_stub
from app.games.stability.timing_model_conflicts import timing_conflict_hints

__all__ = [
    "boundary_violation_flags",
    "detect_abstraction_leak_risk",
    "pressure_matrix_stub",
    "runtime_diff_report",
    "soft_normalization_safe",
    "timing_conflict_hints",
]
