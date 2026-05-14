"""Limites globais de execução."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass
class ExecutionLimits:
    max_execution_steps: int = 96
    max_event_queue: int = 256
    max_recursion_depth: int = 64
    max_mutations_per_tick: int = 128
