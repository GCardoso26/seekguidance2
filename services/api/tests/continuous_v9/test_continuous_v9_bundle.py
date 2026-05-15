from app.evaluation.continuous_v9 import replay_regression_tracking_v9_stub


def test_continuous_v9_stub() -> None:
    out = replay_regression_tracking_v9_stub("ci")
    assert out["replay_stability"] == "tracked_v9"
