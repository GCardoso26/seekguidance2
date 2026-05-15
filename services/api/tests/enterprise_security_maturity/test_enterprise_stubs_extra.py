"""Enterprise security extra stubs."""
from __future__ import annotations

from app.runtime.security_compliance.runtime_enterprise_audit_engine_v1 import (
    runtime_enterprise_audit_engine_v1_stub,
)
from app.runtime.security_compliance.runtime_enterprise_quota_enforcement_v1 import (
    runtime_enterprise_quota_enforcement_v1_stub,
)


def test_audit_engine() -> None:
    assert runtime_enterprise_audit_engine_v1_stub("e")["security_score"] > 0


def test_quota() -> None:
    assert runtime_enterprise_quota_enforcement_v1_stub("e")["security_score"] > 0
