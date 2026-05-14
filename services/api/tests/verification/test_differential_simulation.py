from app.verification.differential.differential_runner import run_differential_simulation


def test_differential_runner_stable_input() -> None:
    out = run_differential_simulation("q", ["layer", "sba"], "abc")
    assert out["pipeline_a_hash"] == "abc"
    assert out["pipeline_b_hash"] == "abc"
    assert out["semantic_divergence"] >= 0.0
