"""Avaliação contínua V4 (judge-grade)."""

from app.evaluation.continuous_v4.branch_explosion_accuracy import branch_explosion_accuracy
from app.evaluation.continuous_v4.cross_tcg_legality import cross_tcg_legality_spread
from app.evaluation.continuous_v4.judge_grade_consistency import judge_grade_consistency_score
from app.evaluation.continuous_v4.multiplayer_consistency import multiplayer_consistency_index
from app.evaluation.continuous_v4.ontology_drift_regression import ontology_drift_regression
from app.evaluation.continuous_v4.proof_stability import proof_stability_index
from app.evaluation.continuous_v4.replacement_loop_accuracy import replacement_loop_accuracy
from app.evaluation.continuous_v4.replay_determinism import replay_determinism_index
from app.evaluation.continuous_v4.solver_accuracy import solver_accuracy_stub
from app.evaluation.continuous_v4.temporal_regression import temporal_regression_flag

__all__ = [
    "branch_explosion_accuracy",
    "cross_tcg_legality_spread",
    "judge_grade_consistency_score",
    "multiplayer_consistency_index",
    "ontology_drift_regression",
    "proof_stability_index",
    "replay_determinism_index",
    "replacement_loop_accuracy",
    "solver_accuracy_stub",
    "temporal_regression_flag",
]
