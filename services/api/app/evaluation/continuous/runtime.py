"""Runtime de avaliação contínua (nightly / regressões) — orquestra métricas existentes."""

from __future__ import annotations

from typing import Any

from app.core.config import Settings
from app.evaluation.continuous_eval.engine import run_judge_grade_eval_bundle


def run_continuous_evaluation_nightly(
    settings: Settings,
    *,
    replay_payload: dict[str, Any] | None = None,
) -> dict[str, Any]:
    if not settings.continuous_eval_nightly:
        return {"enabled": False, "note": "set CONTINUOUS_EVAL_NIGHTLY=true"}
    bundle = run_judge_grade_eval_bundle(replay_payload=replay_payload)
    regressions = {
        "legality": "pending_dataset",
        "replay_stability": bundle.get("replay"),
        "cross_version": "pending_suite",
        "cross_tcg": "pending_suite",
        "drift_trend": "pending_timeseries",
    }
    return {"enabled": True, "bundle": bundle, "regressions_stub": regressions}
