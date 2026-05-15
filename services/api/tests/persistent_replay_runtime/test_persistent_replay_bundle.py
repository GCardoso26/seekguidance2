from app.runtime.persistent_replay_runtime import (
    persistent_replay_operational_bridge_stub,
    replay_snapshot_put_stub,
)


def test_persistent_replay_stubs() -> None:
    assert replay_snapshot_put_stub("r1")["storage_dialect"] == "sqlite"
    assert "components" in persistent_replay_operational_bridge_stub("b1")
