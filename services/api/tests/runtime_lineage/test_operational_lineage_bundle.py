from app.runtime.persistent_replay_runtime import replay_lineage_append_stub


def test_lineage_repository_stub() -> None:
    out = replay_lineage_append_stub("rid", lineage={"t": 1})
    assert out["lineage"]["t"] == 1
