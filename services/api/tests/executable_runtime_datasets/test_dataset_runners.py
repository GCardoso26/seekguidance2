"""Executable dataset runners."""

from __future__ import annotations

from runtime_execution import executable_dataset_runtime_runner_stub


def test_executable_dataset_runner() -> None:
    r = executable_dataset_runtime_runner_stub("run-1")
    assert "assistant_notes" in r
