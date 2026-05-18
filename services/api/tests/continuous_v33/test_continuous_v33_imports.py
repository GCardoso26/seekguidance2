"""continuous_v33 — v32 permanece intacto."""
from __future__ import annotations

import importlib

import pytest

_STUBS = [
    "stewardship_regression_v33_stub",
    "multiversion_regression_v33_stub",
    "ecosystem_governance_regression_v33_stub",
    "longitudinal_reliability_regression_v33_stub",
    "enterprise_support_regression_v33_stub",
    "knowledge_platform_regression_v33_stub",
    "evolution_governance_regression_v33_stub",
    "adoption_readiness_regression_v33_stub",
    "operational_efficiency_regression_v33_stub",
    "stewardship_operations_regression_v33_stub",
]


@pytest.mark.parametrize("fn", _STUBS)
def test_continuous_v33_stub(fn: str) -> None:
    mod = importlib.import_module("app.evaluation.continuous_v33")
    stub = getattr(mod, fn)
    p = stub("sig33")
    assert p["operational_confidence"] > 0
    notes = p.get("assistant_notes", [])
    assert any("v32" in str(n).lower() for n in notes)
