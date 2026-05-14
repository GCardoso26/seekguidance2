"""Worker lógico (um passo de execução)."""

from __future__ import annotations

from typing import Any


def execute_step(role: str, *, step_index: int) -> dict[str, Any]:
    return {"step_index": step_index, "role": role, "status": "ok"}
