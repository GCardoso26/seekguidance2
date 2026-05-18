"""continuous_v40."""
import importlib

import pytest

_STUBS = [
    "civilization_coordination_regression_v40_stub",
    "meta_stability_regression_v40_stub",
    "entropy_reduction_regression_v40_stub",
    "ecosystem_diplomacy_regression_v40_stub",
    "operational_equilibrium_regression_v40_stub",
    "governance_civilization_regression_v40_stub",
    "architectural_convergence_regression_v40_stub",
    "sustainability_ecology_regression_v40_stub",
    "collective_forecasting_regression_v40_stub",
    "public_continuity_regression_v40_stub",
]


@pytest.mark.parametrize("fn", _STUBS)
def test_v40(fn: str) -> None:
    p = getattr(importlib.import_module("app.evaluation.continuous_v40"), fn)("sig40")
    assert p["operational_confidence"] > 0
    assert any("v39" in str(n).lower() for n in p.get("assistant_notes", []))
