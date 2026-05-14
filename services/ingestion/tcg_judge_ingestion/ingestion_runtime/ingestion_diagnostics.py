"""Diagnósticos de job de ingestão."""

from __future__ import annotations

from typing import Any


def ingestion_job_diagnostic(job: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": job.get("id"),
        "ok": bool(job.get("url") or job.get("source_path")),
        "hints": [] if job.get("url") else ["missing_url"],
    }
