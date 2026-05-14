"""Simulação determinística (reasoning-only; não é game server)."""

from __future__ import annotations

from typing import Any

from app.runtime.execution_worker import execute_step
from app.runtime.runtime_queue import RuntimeQueue
from app.runtime.sandbox.execution_limits import ExecutionLimits


class SimulationRuntime:
    def __init__(self, *, limits: ExecutionLimits | None = None) -> None:
        self.limits = limits or ExecutionLimits()
        self.queue = RuntimeQueue(max_size=self.limits.max_event_queue)

    def run_roles(self, ordered_roles: list[str]) -> dict[str, Any]:
        steps_out: list[dict[str, Any]] = []
        cap = min(len(ordered_roles), self.limits.max_execution_steps)
        for i in range(cap):
            steps_out.append(execute_step(ordered_roles[i], step_index=i))
        if len(ordered_roles) > self.limits.max_execution_steps:
            self.queue.push({"type": "sandbox", "reason": "execution_step_cap", "cap": self.limits.max_execution_steps})
        return {"steps": steps_out, "events": self.queue.drain()}
