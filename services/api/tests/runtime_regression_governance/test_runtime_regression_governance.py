from app.evaluation.continuous_v8 import runtime_regression_governance_v8_stub


def test_runtime_regression_governance() -> None:
    assert runtime_regression_governance_v8_stub(0)["open_issues"] == 0
