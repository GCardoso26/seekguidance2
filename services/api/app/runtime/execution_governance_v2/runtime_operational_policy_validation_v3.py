"""runtime_operational_policy_validation_v3 — operational governance real."""

from __future__ import annotations

import threading
from typing import Any

from app.runtime.execution_governance_v2.runtime_governance_summary_v1 import runtime_governance_engine_v1
from app.runtime.security_compliance.runtime_security_operational_engine_v2 import (
    runtime_security_operational_engine_v2,
)

_VIOLATIONS: list[str] = []
_QUOTAS: dict[str, int] = {}
_LOCK = threading.Lock()


def runtime_operational_governance_engine_v3(scope: str) -> dict[str, Any]:
    gov = runtime_governance_engine_v1(scope)
    sec = runtime_security_operational_engine_v2(scope)
    with _LOCK:
        _QUOTAS[scope] = _QUOTAS.get(scope, 0) + 1
        violations = list(sec.get("policy_violations", []))
        if _QUOTAS[scope] > 500:
            violations.append("quota_soft_limit")
    sla = gov.get("sla_score", 0.9)
    score = max(0.0, sla - len(violations) * 0.05)
    integrity = "ok" if not violations else "degraded"
    return {
        "governance_score": round(score, 4),
        "sla_summaries": {"score": sla},
        "quota_summaries": dict(_QUOTAS),
        "governance_violations": violations,
        "escalation_summaries": ["L1"] if violations else [],
        "compliance_readiness_scoring": round(score, 4),
        "tenant_isolation_valid": sec.get("tenant_isolation_valid", True),
        "integrity_status": integrity,
        "runtime_confidence": round(score, 4),
    }


def runtime_operational_policy_validation_v3_stub(
    scope: str,
    *,
    storage_path: str | None = None,
) -> dict[str, Any]:
    report = runtime_operational_governance_engine_v3(scope)
    return {
        "scope": scope,
        "storage_path": storage_path or "default",
        "assistant_notes": ["runtime_operational_governance_engine_v3: governance real."],
        "deterministic_alignment": {"token": f"govreal3-{scope}"},
        "runtime_confidence": report["runtime_confidence"],
        "replay_summary": {},
        "lineage_summary": report["sla_summaries"],
        "divergence_summary": {"violations": report["governance_violations"]},
        "governance_summary": report,
        "lifecycle_summary": {},
        "operational_notes": report["escalation_summaries"],
        "integrity_status": report["integrity_status"],
        "governance_score": report["governance_score"],
    }
