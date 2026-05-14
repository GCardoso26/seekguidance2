"""Validação offline de datasets (stub)."""

from __future__ import annotations

from typing import Any


def offline_dataset_validation_stub(dataset_id: str) -> dict[str, Any]:
    return {
        "dataset_id": dataset_id,
        "assistant_notes": ["Validação incremental com checksums e contagem de linhas."],
        "integrity_status": {"ok": True},
        "replay_summary": {"validated_batches": 2},
        "deterministic_alignment": {"token": f"odv-{dataset_id}"},
    }
