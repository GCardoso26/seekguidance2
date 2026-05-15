from runtime_execution import runtime_dataset_runner_stub


def test_runtime_dataset_runner_payload() -> None:
    out = runtime_dataset_runner_stub(replay_refs=[{"id": "a"}], lineage={"slice": "s"}, snapshots=[])
    assert "assistant_notes" in out
    assert out["runtime_confidence"] > 0
