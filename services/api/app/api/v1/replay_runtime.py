"""Rotas de replay runtime com validação e alinhamento a contratos estáveis."""

from __future__ import annotations

import uuid
from typing import Any

from app.contracts.replay_runtime_contracts import ReplayRefBody, ReplayValidateIn
from app.observability.runtime_exporters.span_registry import otel_span_registry
from app.runtime.persistent_replay_runtime import (
    replay_diff_store_stub,
    replay_lineage_service_stub,
    replay_reconciliation_service_stub,
    replay_runtime_health_stub,
    replay_runtime_service_stub,
)
from app.runtime.replay_governance_v2.executable_replay_governance import executable_replay_governance_run
from fastapi import APIRouter

router = APIRouter(prefix="/replay", tags=["replay"])


def _envelope(
    request_id: str,
    lineage_id: str | None,
    inner: dict[str, Any],
) -> dict[str, Any]:
    gov = executable_replay_governance_run(str(inner.get("replay_ref", "unknown")))
    scores = gov["scores"]
    return {
        "replay_request_id": request_id,
        "replay_lineage_id": lineage_id,
        "replay_consistency_summary": {
            "aligned": True,
            "otel_span": otel_span_registry().get("replay_validate", "tcg_judge.replay.validate"),
        },
        "contradiction_summary": scores["contradiction_summary"],
        "deterministic_replay_hints": {
            "alignment_score": scores.get("deterministic_alignment_score"),
            "replay_ref": inner.get("replay_ref"),
        },
        "replay_governance_scores": scores,
        "payload": inner,
    }


@router.get("/health")
async def replay_health() -> dict[str, Any]:
    rid = str(uuid.uuid4())
    base = replay_runtime_health_stub("api")
    merged: dict[str, Any] = {
        "replay_request_id": rid,
        "replay_lineage_id": None,
        "runtime_health_summary": base.get("replay_health_summary", {}),
        "contradiction_summary": {"open": 0},
        "deterministic_replay_hints": base.get("deterministic_replay_alignment", {}),
        "assistant_notes": list(base.get("assistant_notes", [])),
    }
    merged.update(base)
    return merged


@router.post("/validate")
async def replay_validate(body: ReplayValidateIn) -> dict[str, Any]:
    rid = body.replay_request_id or str(uuid.uuid4())
    lineage = body.replay_lineage_id
    inner = {
        "replay_ref": body.replay_ref,
        "valid_stub": True,
        "assistant_notes": ["Validação assistida; reasoning_v1…v11 inalterados."],
        "deterministic_alignment": {"token": f"val-{body.replay_ref}"},
        "payload_hints": body.payload_hints,
    }
    return _envelope(rid, lineage, inner)


@router.post("/lineage")
async def replay_lineage(body: ReplayRefBody) -> dict[str, Any]:
    rid = body.replay_request_id or str(uuid.uuid4())
    inner = replay_lineage_service_stub(body.replay_ref)
    inner["replay_ref"] = body.replay_ref
    return _envelope(rid, body.replay_lineage_id, inner)


@router.post("/diff")
async def replay_diff(body: ReplayRefBody) -> dict[str, Any]:
    rid = body.replay_request_id or str(uuid.uuid4())
    inner = replay_diff_store_stub(body.replay_ref)
    inner["replay_ref"] = body.replay_ref
    return _envelope(rid, body.replay_lineage_id, inner)


@router.post("/reconcile")
async def replay_reconcile(body: ReplayRefBody) -> dict[str, Any]:
    rid = body.replay_request_id or str(uuid.uuid4())
    inner = replay_reconciliation_service_stub(body.replay_ref)
    inner["replay_ref"] = body.replay_ref
    return _envelope(rid, body.replay_lineage_id, inner)


@router.post("/runtime-summary")
async def replay_runtime_summary(body: ReplayRefBody) -> dict[str, Any]:
    rid = body.replay_request_id or str(uuid.uuid4())
    inner = replay_runtime_service_stub(body.replay_ref)
    inner["replay_ref"] = body.replay_ref
    return _envelope(rid, body.replay_lineage_id, inner)
