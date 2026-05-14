from app.runtime.replay.replay_validation import validate_replay


def test_replay_consistency() -> None:
    payload = {"question": "x", "roles": ["replacement", "layer"]}
    out = validate_replay(payload, runs=4)
    assert out["stable_replay_hash"]
