"""Orquestração runtime com consciência AWS (opcional; compose inalterado)."""

from __future__ import annotations

from typing import Any

from app.core.config import get_settings


def aws_runtime_orchestration_stub() -> dict[str, Any]:
    s = get_settings()
    return {
        "aws_platform_enabled": s.aws_platform_enabled,
        "eks_cluster_name": s.eks_cluster_name,
        "s3_replay_archive_bucket": s.s3_replay_archive_bucket,
        "replay_storage_backend": s.replay_storage_backend,
        "semantic_storage_backend": s.semantic_storage_backend,
        "assistant_notes": [
            "AWS é opcional: sem flags não há chamadas boto3 aqui.",
            "Determinismo e explainability-first preservados.",
        ],
    }
