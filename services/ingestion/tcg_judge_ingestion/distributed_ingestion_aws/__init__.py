"""Ingestão massiva com checkpoints S3 (opcional; throttling publisher)."""

from __future__ import annotations

from typing import Any


def distributed_ingestion_aws_runtime_stub(host: str) -> dict[str, Any]:
    return {
        "host": host,
        "ingestion_version": "0.1.0",
        "checkpoint_prefix_env": "INGESTION_CHECKPOINT_S3_PREFIX",
        "assistant_notes": [
            "Throttling e DLQ alinhados a workers existentes (arq/Redis).",
            "Corpus persistence em S3: configurar bucket sem alterar pipelines V1–V11.",
        ],
    }
