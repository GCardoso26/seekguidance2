from app.evaluation.continuous_v8 import judge_runtime_ci_v8_stub


def test_judge_runtime_ci_v8() -> None:
    out = judge_runtime_ci_v8_stub("b42")
    assert out["build_id"] == "b42"
    assert out["cross_tcg_safe"] is True
