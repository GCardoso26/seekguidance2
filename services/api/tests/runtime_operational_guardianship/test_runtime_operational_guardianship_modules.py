"""runtime_operational_guardianship."""
from __future__ import annotations

import importlib

import pytest

_PKG = "app.runtime.runtime_operational_guardianship"
_MODULES = [
    "runtime_operational_guardianship_engine_v1",
    "runtime_guardianship_scoring_v1",
    "runtime_guardianship_registry_v1",
    "runtime_guardianship_summary_v1",
]


@pytest.mark.parametrize("name", _MODULES)
def test_grd_stub(name: str) -> None:
    mod = importlib.import_module(f"{_PKG}.{name}")
    r = getattr(mod, f"{name}_stub")(f"grd-{name}")
    assert r["integrity_status"] == "ok"
    assert float(r["runtime_confidence"]) > 0
