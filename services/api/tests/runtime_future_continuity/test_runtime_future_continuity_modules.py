"""runtime_future_continuity."""
from __future__ import annotations

import importlib

import pytest

_PKG = "app.runtime.runtime_future_continuity"
_MODULES = [
    "runtime_future_continuity_engine_v1",
    "runtime_future_continuity_scoring_v1",
    "runtime_future_continuity_summary_v1",
]


@pytest.mark.parametrize("name", _MODULES)
def test_fct_stub(name: str) -> None:
    mod = importlib.import_module(f"{_PKG}.{name}")
    r = getattr(mod, f"{name}_stub")(f"fct-{name}")
    assert r["integrity_status"] == "ok"
    assert float(r["runtime_confidence"]) > 0
