"""Distributed runtime live."""

from __future__ import annotations

from app.runtime.production_runtime import (
    adaptive_runtime_scaling_ops_stub,
    distributed_worker_orchestration_stub,
)


def test_worker_orch() -> None:
    assert distributed_worker_orchestration_stub(3)["workers"] == 3


def test_adaptive_scaling() -> None:
    assert adaptive_runtime_scaling_ops_stub(100, threshold=10)["scale_out"] is True
