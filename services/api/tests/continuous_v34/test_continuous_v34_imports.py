"""continuous_v34 — v33 intacto."""
from __future__ import annotations

import importlib

import pytest

_STUBS = [
    "operational_autonomy_regression_v34_stub",
    "continuous_certification_regression_v34_stub",
    "global_ecosystem_regression_v34_stub",
    "sustainability_intelligence_regression_v34_stub",
    "advanced_support_regression_v34_stub",
    "operational_learning_regression_v34_stub",
    "platform_economics_regression_v34_stub",
]


@pytest.mark.parametrize("fn", _STUBS)
def test_continuous_v34_stub(fn: str) -> None:
    mod = importlib.import_module("app.evaluation.continuous_v34")
    p = getattr(mod, fn)("sig34")
    assert p["operational_confidence"] > 0
    assert any("v33" in str(n).lower() for n in p.get("assistant_notes", []))
