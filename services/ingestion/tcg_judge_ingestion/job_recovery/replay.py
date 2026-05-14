"""Recuperação de jobs falhados (replay de payload)."""

from __future__ import annotations

from typing import Any


def recovery_payload(job_id: str, error: str) -> dict[str, Any]:
    return {"job_id": job_id, "error": error, "action": "requeue_with_backoff"}
