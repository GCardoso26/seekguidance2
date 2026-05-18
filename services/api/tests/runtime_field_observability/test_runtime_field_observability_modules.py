"""runtime_field_observability."""
from __future__ import annotations

import importlib

import pytest

_PKG = "app.runtime.runtime_field_observability"
_MODULES = [
    "runtime_field_observability_engine_v1",
    "runtime_field_observability_scoring_v1",
    "runtime_field_observability_registry_v1",
    "runtime_field_observability_summary_v1",
]


@pytest.mark.parametrize("name", _MODULES)
def test_fov_stub(name: str) -> None:
    mod = importlib.import_module(f"{_PKG}.{name}")
    r = getattr(mod, f"{name}_stub")(f"fov-{name}")
    assert r["integrity_status"] == "ok"
    assert float(r["runtime_confidence"]) > 0
