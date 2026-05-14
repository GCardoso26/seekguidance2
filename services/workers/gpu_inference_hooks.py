"""Worker stub: filas GPU para rerank/embeddings (integrar com arq/redis)."""

from __future__ import annotations

from typing import Any


def gpu_job_descriptor(kind: str, batch_size: int) -> dict[str, Any]:
    return {"kind": kind, "batch_size": batch_size, "device": "cuda_or_cpu_autodetect"}
