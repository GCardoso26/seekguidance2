"""Sandbox e limites."""

from __future__ import annotations

from app.runtime.sandbox.execution_limits import ExecutionLimits
from app.runtime.sandbox.recursion_guard import RecursionGuard
from app.runtime.simulation_runtime import SimulationRuntime


def test_recursion_guard_blocks() -> None:
    g = RecursionGuard(max_depth=2)
    assert g.enter() and g.enter()
    assert not g.enter()


def test_simulation_truncates() -> None:
    lim = ExecutionLimits(max_execution_steps=2)
    sim = SimulationRuntime(limits=lim)
    out = sim.run_roles(["a", "b", "c", "d"])
    assert len(out["steps"]) == 2
