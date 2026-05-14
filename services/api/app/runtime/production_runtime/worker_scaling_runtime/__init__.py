"""Escalonamento de workers."""

from __future__ import annotations

from typing import Any


def worker_scaling_runtime_stub(desired: int) -> dict[str, Any]:
    return {"desired": desired, "assistant_notes": ["Perfis de autoscaling documentados em infra/runtime_operations."]}
