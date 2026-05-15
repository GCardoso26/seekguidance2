"""Gates dataset runtime_execution."""

from __future__ import annotations

from runtime_execution import dataset_replay_stability_gate_stub


def test_dataset_gate_payload() -> None:
    g = dataset_replay_stability_gate_stub("run-1")
    assert g["pass"] is True
    assert "deterministic_alignment" in g
