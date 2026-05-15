from runtime_execution import replay_integrity_runner_stub


def test_replay_integrity_runner() -> None:
    out = replay_integrity_runner_stub(replay_refs=[{"id": "r"}], lineage=None, snapshots=None)
    assert "replay_stability_summary" in out
