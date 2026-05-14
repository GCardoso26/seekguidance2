"""Orquestração de workers em ambientes AWS (SQS/EKS) — stub configurável."""

from __future__ import annotations

from typing import Any

# Workers executam fora do pacote app; mantemos dict puro para CI sem Settings.


def aws_worker_runtime_hints(
    *,
    queue_name: str | None = None,
    dlq_url: str | None = None,
    massive_ingestion: bool = False,
) -> dict[str, Any]:
    return {
        "queue_name": queue_name,
        "dlq_url": dlq_url,
        "massive_ingestion": massive_ingestion,
        "assistant_notes": [
            "Ligar WORKER_RUNTIME_QUEUE_NAME / WORKER_RUNTIME_DLQ_SQS_URL na API Settings quando adoptar SQS.",
            "DLQ persistente: SQS ou Redis (já suportado em código workers).",
        ],
    }
