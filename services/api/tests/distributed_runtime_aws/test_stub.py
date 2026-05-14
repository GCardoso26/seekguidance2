from app.runtime.production_runtime import distributed_runtime_v2_stub


def test_distributed_runtime_stub() -> None:
    assert distributed_runtime_v2_stub(2)["nodes"] == 2
