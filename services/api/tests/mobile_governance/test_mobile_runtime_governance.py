"""Governança do runtime móvel."""

from __future__ import annotations

from app.mobile_runtime import mobile_runtime_governance_stub


def test_mobile_runtime_governance() -> None:
    out = mobile_runtime_governance_stub("strict")
    assert out["deterministic_alignment"]["policy_hash"] == "gov-strict"
