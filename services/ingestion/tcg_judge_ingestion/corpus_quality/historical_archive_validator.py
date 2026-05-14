"""Validação mínima de registos de arquivo histórico."""

from __future__ import annotations

from typing import Any


def validate_archive_record(record: dict[str, Any]) -> dict[str, object]:
    required = {"source_id", "retrieved_at", "body_hash"}
    missing = sorted(required - set(record.keys()))
    return {"ok": not missing, "missing": missing}
