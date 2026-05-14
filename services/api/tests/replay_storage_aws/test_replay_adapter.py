from app.runtime.replay_governance_v2 import replay_storage_adapters_aws_stub


def test_replay_storage_adapter_stub() -> None:
    out = replay_storage_adapters_aws_stub("b1")
    assert out["bundle_id"] == "b1"
