"""Priorização de jobs de ingestão."""

from __future__ import annotations

from typing import Any


def schedule_ingestion_jobs(jobs: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return sorted(jobs, key=lambda j: (-int(j.get("priority", 0)), str(j.get("id", ""))))
