"""Alinhamento storage cloud vs replay local (stub)."""

from __future__ import annotations

from typing import Any


def aws_runtime_storage_alignment_stub(scope: str) -> dict[str, Any]:
    return {
        "scope": scope,
        "assistant_notes": ["aws_runtime_storage_alignment: S3/EFS como hints; SQLite/Realm no edge."],
        "operational_hints": {"s3_object_versioning_hint": True},
        "replay_alignment": {"dialect_hint": "filesystem_or_sqlite_edge"},
        "deterministic_runtime_notes": ["Soft normalization preservada entre destinos."],
        "deployment_constraints": {"boto3_required": False},
        "runtime_confidence": 0.71,
    }
