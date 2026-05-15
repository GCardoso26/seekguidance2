"""replay_determinism_certification_v1 — certificação determinística."""

from __future__ import annotations

from typing import Any

from app.runtime.persistent_replay_runtime.replay_deterministic_audit_runtime_v3 import (
    audit_replay_determinism,
)


def certify_replay(replay_ref: str) -> dict[str, Any]:
    audit = audit_replay_determinism(replay_ref, {})
    cert_score = (audit["audit_score"] + (1.0 if audit["rollback_traceable"] else 0.5)) / 2.0
    repro = audit["audit_score"]
    divergence = 1.0 - repro
    return {
        "replay_ref": replay_ref,
        "certification_score": round(cert_score, 4),
        "reproducibility_score": round(repro, 4),
        "divergence_score": round(divergence, 4),
        "audit_trail": audit,
    }


def replay_determinism_certification_v1_stub(
    replay_ref: str,
    *,
    storage_path: str | None = None,
) -> dict[str, Any]:
    report = certify_replay(replay_ref)
    return {
        "scope": replay_ref,
        "storage_path": storage_path or "default",
        "assistant_notes": ["replay_determinism_certification_v1: determinism certified."],
        "deterministic_alignment": {"token": report["audit_trail"]["trace_token"]},
        "runtime_confidence": report["certification_score"],
        "replay_summary": report["audit_trail"],
        "lineage_summary": report["audit_trail"].get("journal", {}),
        "divergence_summary": {"score": report["divergence_score"]},
        "governance_summary": report,
        "lifecycle_summary": {},
        "operational_notes": ["certified"],
        "certification_score": report["certification_score"],
        "reproducibility_score": report["reproducibility_score"],
    }
