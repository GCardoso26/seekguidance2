"""enterprise_product_runtime_v3."""
from __future__ import annotations

from app.runtime.product_runtime.runtime_tenant_operator_activity_v3 import runtime_tenant_operator_activity_v3_stub

_KEYS = (
    "assistant_notes",
    "deterministic_alignment",
    "runtime_confidence",
    "governance_summary",
    "lifecycle_summary",
    "operational_notes",
    "divergence_summary",
    "replay_summary",
    "integrity_status",
)


def test_enterprise_product_runtime_v3_payload() -> None:
    p = runtime_tenant_operator_activity_v3_stub("pcv1-prod")
    assert p["runtime_confidence"] > 0
    for k in _KEYS:
        assert k in p
