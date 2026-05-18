"""runtime_operational_simplification."""
from __future__ import annotations

import importlib

import pytest

_PKG = "app.runtime.runtime_operational_simplification"
_MODULES = [
    "runtime_operational_simplification_engine_v1",
    "runtime_simplification_scoring_v1",
    "runtime_simplification_registry_v1",
    "runtime_operational_simplification_summary_v1",
]


@pytest.mark.parametrize("name", _MODULES)
def test_ops_stub(name: str) -> None:
    mod = importlib.import_module(f"{_PKG}.{name}")
    r = getattr(mod, f"{name}_stub")(f"ops-{name}")
    assert r["integrity_status"] == "ok"
    assert float(r["runtime_confidence"]) > 0
