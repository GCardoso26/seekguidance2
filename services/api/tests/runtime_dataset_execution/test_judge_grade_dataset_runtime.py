from judge_grade_datasets_v4.runtime_dataset_execution import runtime_dataset_execution_stub


def test_judge_grade_runtime_dataset_stub() -> None:
    out = runtime_dataset_execution_stub("run-1")
    assert out["deterministic_recovery_alignment"]["token"] == "rde-run-1"
