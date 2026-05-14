"""Smoke test do benchmark em disco."""

from app.evaluation.benchmark_runner import run_benchmark_on_disk


def test_benchmark_runs() -> None:
    out = run_benchmark_on_disk("mtg")
    assert out["n"] >= 1
    assert "mean" in out
