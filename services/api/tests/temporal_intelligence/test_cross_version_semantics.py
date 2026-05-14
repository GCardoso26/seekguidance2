from app.runtime.history.replay_version_alignment import align_replay_versions


def test_cross_version_semantics_alignment() -> None:
    out = align_replay_versions(["x", "y"], "x")
    assert out["aligned"] is True
