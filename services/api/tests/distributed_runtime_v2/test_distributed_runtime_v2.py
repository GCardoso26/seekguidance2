from app.runtime.production_runtime import distributed_runtime_v2_stub


def test_distributed_runtime_v2() -> None:
    assert distributed_runtime_v2_stub(3)["nodes"] == 3
