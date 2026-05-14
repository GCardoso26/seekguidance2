from app.testing.adversarial.adversarial_runtime import run_adversarial_runtime


def test_adversarial_runtime_has_signals() -> None:
    out = run_adversarial_runtime()
    assert "replacement_loop_score" in out
    assert "graph_exploded" in out
