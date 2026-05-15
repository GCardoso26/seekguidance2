"""Real governance behaviors."""
from __future__ import annotations

from pathlib import Path

from app.runtime.security_compliance.runtime_real_governance_summary_v1 import (
    runtime_real_governance_engine_v1,
)


def test_real_governance_engine() -> None:
    r = runtime_real_governance_engine_v1("ga19-gov")
    assert r["security_score"] > 0


def test_audit_retention_filesystem() -> None:
    runtime_real_governance_engine_v1("ga19-audit")
    root = Path("generated/runtime_artifacts/governance_audit_v1")
    assert list(root.glob("*.json"))
