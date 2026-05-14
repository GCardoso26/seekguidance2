"""Executor simbólico: aplica descrições do plano como passos de simulação."""

from __future__ import annotations

from app.reasoning.types import ExecutionStep


def execute_plan(steps: list[ExecutionStep]) -> list[str]:
    return [s.description for s in steps]
