"""ecosystem_governance modules."""
from __future__ import annotations

import importlib

import pytest

_PKG = "app.runtime.ecosystem_operations"
_MODULES = [
    "ecosystem_governance_engine_v1",
    "ecosystem_partner_registry_v1",
    "ecosystem_runtime_policy_v1",
    "ecosystem_sdk_lifecycle_v1",
    "ecosystem_release_governance_v1",
    "ecosystem_operational_adoption_v1",
    "ecosystem_support_governance_v1",
    "ecosystem_feedback_governance_v1",
    "ecosystem_stability_governance_v1",
    "ecosystem_governance_summary_v1",
]


@pytest.mark.parametrize("name", _MODULES)
def test_ecogov_stub(name: str) -> None:
    mod = importlib.import_module(f"{_PKG}.{name}")
    stub = getattr(mod, f"{name}_stub")
    r = stub(f"ecogov-{name}")
    assert r["integrity_status"] == "ok"
    assert float(r["runtime_confidence"]) > 0


def test_ecosystem_governance_engine() -> None:
    from app.runtime.ecosystem_operations.ecosystem_governance_summary_v1 import ecosystem_governance_engine_v1

    assert ecosystem_governance_engine_v1("eco-sum")["ecosystem_governance_score"] > 0
