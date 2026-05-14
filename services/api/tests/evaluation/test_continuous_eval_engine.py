"""Motor de avaliação contínua."""

from __future__ import annotations

from app.evaluation.continuous_eval.engine import run_judge_grade_eval_bundle


def test_run_judge_grade_eval_bundle() -> None:
    out = run_judge_grade_eval_bundle()
    assert "replay" in out
    assert out["formal_legality_stub"].get("sat") is True
