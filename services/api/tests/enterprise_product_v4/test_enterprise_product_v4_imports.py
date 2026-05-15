"""enterprise_product_v4."""
from __future__ import annotations

from app.runtime.product_runtime.runtime_enterprise_portal_summary_v1 import runtime_enterprise_portal_summary_v1_stub

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


def test_enterprise_product_v4_payload() -> None:
    p = runtime_enterprise_portal_summary_v1_stub("epv2-prod")
    assert p["runtime_confidence"] > 0
    for k in _KEYS:
        assert k in p
