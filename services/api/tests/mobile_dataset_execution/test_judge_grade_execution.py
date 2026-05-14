from judge_grade_datasets_v4 import mobile_runtime_execution_stub


def test_mobile_dataset_execution() -> None:
    out = mobile_runtime_execution_stub("run-1")
    assert out["lineage_snapshot"]["dataset_lineage"] == "run-1"
