"""Motor de avaliação contínua judge-grade (orquestra suites existentes + stubs formais)."""

from __future__ import annotations

from typing import Any

from app.core.config import get_settings
from app.evaluation.runtime.deterministic_replay_metrics import replay_determinism_score
from app.verification.formal_solver import compile_legality_ir, verify_compiled


def run_judge_grade_eval_bundle(*, replay_payload: dict[str, Any] | None = None) -> dict[str, Any]:
    settings = get_settings()
    replay_payload = replay_payload or {"events": [], "seed": 1}
    det = replay_determinism_score(replay_payload, runs=3)
    leg_ir = compile_legality_ir({"priority_window_open": True, "stack_legal": True})
    leg = verify_compiled(leg_ir)
    return {
        "continuous_eval_nightly": settings.continuous_eval_nightly,
        "replay": det,
        "formal_legality_stub": leg,
        "corpus_trust_floor": settings.corpus_trust_floor,
    }
