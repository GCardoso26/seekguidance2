"""runtime_evolutionary_forecasting."""
from __future__ import annotations

import importlib

import pytest

_PKG = "app.runtime.runtime_evolutionary_forecasting"
_MODULES = [
    "runtime_evolutionary_forecasting_engine_v1",
    "runtime_evolutionary_forecasting_scoring_v1",
    "runtime_evolutionary_forecasting_summary_v1",
]


@pytest.mark.parametrize("name", _MODULES)
def test_evf_stub(name: str) -> None:
    mod = importlib.import_module(f"{_PKG}.{name}")
    r = getattr(mod, f"{name}_stub")(f"evf-{name}")
    assert r["integrity_status"] == "ok"
    assert float(r["runtime_confidence"]) > 0
