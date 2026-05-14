"""Adapters de armazenamento de replay para AWS S3 (opcional; stub honesto)."""

from __future__ import annotations

from typing import Any

from app.core.config import get_settings


def replay_storage_adapters_aws_stub(bundle_id: str) -> dict[str, Any]:
    s = get_settings()
    return {
        "bundle_id": bundle_id,
        "backend": s.replay_storage_backend,
        "bucket": s.s3_replay_archive_bucket,
        "assistant_notes": [
            "Sem boto3 por defeito; configurar bucket + IRSA para persistência real.",
            "Governança de lineage e hashes continua explainability-first.",
        ],
    }
