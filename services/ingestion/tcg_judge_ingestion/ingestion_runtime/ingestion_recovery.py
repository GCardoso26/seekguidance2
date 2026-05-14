"""Recuperação / jobs replayáveis (metadados)."""

from __future__ import annotations

from typing import Any


def replayable_job_stub(job_id: str, payload_hash: str) -> dict[str, Any]:
    return {"job_id": job_id, "payload_hash": payload_hash, "replayable": True}
