from app.runtime.production_runtime import worker_scaling_runtime_stub


def test_worker_scaling_runtime() -> None:
    assert worker_scaling_runtime_stub(4)["desired"] == 4
