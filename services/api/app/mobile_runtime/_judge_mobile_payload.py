"""Payloads explainability-first partilhados pelo runtime móvel (stubs)."""

from __future__ import annotations

from collections.abc import Mapping
from typing import Any


def attach_storage_operational_fields(
    payload: dict[str, Any],
    *,
    storage_status: Mapping[str, Any],
    integrity_status: Mapping[str, Any],
    replay_alignment: Mapping[str, Any],
    lineage_snapshot: Mapping[str, Any],
    offline_constraints: list[str],
) -> dict[str, Any]:
    """Campos operacionais de storage/replay para stubs mobile/offline."""
    out = dict(payload)
    out["storage_status"] = dict(storage_status)
    out["integrity_status"] = dict(integrity_status)
    out["replay_alignment"] = dict(replay_alignment)
    out["lineage_snapshot"] = dict(lineage_snapshot)
    out["offline_constraints"] = list(offline_constraints)
    return out


def attach_persistent_operational_fields(
    payload: dict[str, Any],
    *,
    persistent_status: Mapping[str, Any],
    storage_recovery: Mapping[str, Any],
    replay_reconciliation: Mapping[str, Any],
    lineage_persistence: Mapping[str, Any],
    deterministic_recovery_alignment: Mapping[str, Any],
) -> dict[str, Any]:
    """Campos de persistência híbrida / recovery determinístico (stubs operacionais)."""
    out = dict(payload)
    out["persistent_status"] = dict(persistent_status)
    out["storage_recovery"] = dict(storage_recovery)
    out["replay_reconciliation"] = dict(replay_reconciliation)
    out["lineage_persistence"] = dict(lineage_persistence)
    out["deterministic_recovery_alignment"] = dict(deterministic_recovery_alignment)
    return out


def judge_mobile_core_payload(
    *,
    replay_summary: Mapping[str, Any],
    sync_hints: list[str],
    deterministic_alignment: Mapping[str, Any],
    mobile_constraints: Mapping[str, Any],
    offline_confidence: float,
    assistant_notes: list[str],
    lineage_replay_slice: str,
    extras: Mapping[str, Any] | None = None,
) -> dict[str, Any]:
    """Campos mínimos: notas ao juiz, resumo de replay, hints de sync, alinhamento determinístico."""
    out: dict[str, Any] = {
        "assistant_notes": assistant_notes,
        "replay_summary": dict(replay_summary),
        "sync_hints": sync_hints,
        "deterministic_alignment": dict(deterministic_alignment),
        "mobile_constraints": dict(mobile_constraints),
        "offline_confidence": float(offline_confidence),
        "lineage_replay_awareness": {
            "replay_slice_id": lineage_replay_slice,
            "deterministic_resume_token": "det-resume-v0",
            "governance": "explainability-first; núcleo reasoning_v1…v11 no servidor.",
            "operational_safety": "soft-normalization-only; sem equivalência forte entre TCGs.",
        },
    }
    if extras:
        out.update(dict(extras))
    return out
