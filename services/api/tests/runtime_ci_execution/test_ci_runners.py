"""CI runners executáveis."""
from evaluation.runtime_execution import runtime_dataset_ci_execution_stub


def test_ci_runner_shape() -> None:
    p = runtime_dataset_ci_execution_stub("run-1")
    assert "legality_gate_summary" in p
    assert p["runtime_ci_confidence"] > 0
