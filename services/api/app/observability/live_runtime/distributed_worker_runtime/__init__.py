"""Workers distribuídos (observabilidade)."""

from __future__ import annotations

from typing import Any


def distributed_worker_runtime_stub(workers: int) -> dict[str, Any]:
    return {"workers": workers, "assistant_notes": ["Métricas por worker + DLQ visibility."]}
