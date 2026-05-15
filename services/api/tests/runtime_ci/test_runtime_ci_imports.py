"""Smoke runtime_ci runner e um gate."""

from __future__ import annotations

from evaluation.runtime_ci import replay_stability_gate_stub, runtime_ci_runner_stub


def test_runtime_ci_runner_shape() -> None:
    r = runtime_ci_runner_stub("ci-1")
    assert r["pass"] is True
    assert "confidence" in r
    assert "replay_reasoning" in r


def test_replay_stability_gate_shape() -> None:
    g = replay_stability_gate_stub("scope")
    assert "pass" in g
    assert "confidence" in g
