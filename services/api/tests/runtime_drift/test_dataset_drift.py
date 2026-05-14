from executable_datasets import dataset_drift_runtime_stub


def test_dataset_drift_runtime() -> None:
    out = dataset_drift_runtime_stub("case-a")
    assert out["replay_summary"]["layer"] == "dataset_drift_runtime"
