"""continuous_v32 — v31 permanece intacto; regressão convergência/sustentabilidade."""
from __future__ import annotations

import importlib

import pytest

_STUBS = [
    "convergence_regression_v32_stub",
    "simplification_regression_v32_stub",
    "real_operations_regression_v32_stub",
    "observability_optimization_regression_v32_stub",
    "performance_sustainability_regression_v32_stub",
    "enterprise_ops_ux_regression_v32_stub",
    "release_sustainability_regression_v32_stub",
    "longrun_certification_regression_v32_stub",
    "ecosystem_operations_regression_v32_stub",
    "production_sustainability_regression_v32_stub",
]


@pytest.mark.parametrize("fn", _STUBS)
def test_continuous_v32_stub(fn: str) -> None:
    mod = importlib.import_module("app.evaluation.continuous_v32")
    stub = getattr(mod, fn)
    p = stub("sig32")
    assert p["operational_confidence"] > 0
    notes = p.get("assistant_notes", [])
    assert any("v31" in str(n).lower() for n in notes)
