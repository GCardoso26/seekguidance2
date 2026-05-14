from app.runtime.replay.replay_validation import validate_replay


def test_runtime_determinism() -> None:
    out = validate_replay({"roles": ["a", "b"]}, runs=3)
    assert out["deterministic"] is True
