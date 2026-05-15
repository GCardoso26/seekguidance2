"""enterprise_security_ga."""
from __future__ import annotations

from app.runtime.security_compliance.runtime_real_governance_summary_v1 import runtime_real_governance_summary_v1_stub


def test_enterprise_security_ga_imports() -> None:
    r = runtime_real_governance_summary_v1_stub("ga30-x")
    assert r["runtime_confidence"] > 0
