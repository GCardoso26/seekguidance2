from app.runtime.history.semantic_replay_diff import replay_divergence


def test_replay_history_divergence() -> None:
    assert replay_divergence("h1", "h2") >= 0.0
