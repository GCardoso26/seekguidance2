from app.evaluation.continuous_v8 import judge_grade_runtime_accuracy_v8_stub


def test_continuous_v8_stub() -> None:
    out = judge_grade_runtime_accuracy_v8_stub(3)
    assert out["window_days"] == 3
