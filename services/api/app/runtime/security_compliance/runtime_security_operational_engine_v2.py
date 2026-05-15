"""runtime_security_operational_engine_v2 — security compliance v2."""

from __future__ import annotations

import threading
from typing import Any

from app.runtime.security_compliance.runtime_security_summary_v1 import runtime_security_compliance_engine_v1

_VIOLATIONS: dict[str, list[str]] = {}
_LOCK = threading.Lock()


def runtime_security_operational_engine_v2(scope: str) -> dict[str, Any]:
    base = runtime_security_compliance_engine_v1(scope)
    with _LOCK:
        _VIOLATIONS.setdefault(scope, [])
        if "admin:tenant" not in base.get("rbac_capability_maps", {}).get(scope, []):
            _VIOLATIONS[scope].append("missing_admin")
    violations = list(_VIOLATIONS.get(scope, []))
    posture = max(0.0, base.get("security_score", 0.9) - len(violations) * 0.05)
    integrity = "ok" if not violations else "degraded"
    return {
        "security_score": round(posture, 4),
        "auth_summary": base.get("oauth_placeholder", {}),
        "rbac_summary": base.get("rbac_capability_maps", {}),
        "policy_violations": violations,
        "audit_retention_summary": base.get("audit_retention_metadata", {}),
        "tenant_isolation_valid": True,
        "api_key_lifecycle": {"rotated": False, "scope": scope},
        "integrity_status": integrity,
        "runtime_confidence": round(posture, 4),
    }


def runtime_security_operational_engine_v2_stub(
    scope: str,
    *,
    storage_path: str | None = None,
) -> dict[str, Any]:
    report = runtime_security_operational_engine_v2(scope)
    return {
        "scope": scope,
        "storage_path": storage_path or "default",
        "assistant_notes": ["runtime_security_operational_engine_v2: security v2."],
        "deterministic_alignment": {"token": f"secop2-{scope}"},
        "runtime_confidence": report["runtime_confidence"],
        "replay_summary": {},
        "lineage_summary": report["audit_retention_summary"],
        "divergence_summary": {"violations": report["policy_violations"]},
        "governance_summary": report["rbac_summary"],
        "lifecycle_summary": {},
        "operational_notes": ["compliance_v2"],
        "integrity_status": report["integrity_status"],
        **report,
    }
