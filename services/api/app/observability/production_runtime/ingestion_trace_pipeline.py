"""Pipeline de trace de ingestão (stub)."""

from __future__ import annotations

from typing import Any


def ingestion_trace_stub(job_id: str) -> dict[str, Any]:
    return {"pipeline": "ingestion", "job_id": job_id, "spans": ["fetch", "parse", "validate"]}
