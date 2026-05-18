"""runtime_structural_alignment."""
from __future__ import annotations

import importlib

import pytest

_PKG = "app.runtime.runtime_structural_alignment"
_MODULES = [
    "runtime_structural_alignment_engine_v1",
    "runtime_structural_alignment_scoring_v1",
    "runtime_structural_alignment_registry_v1",
    "runtime_structural_alignment_summary_v1",
]


@pytest.mark.parametrize("name", _MODULES)
def test_sal_stub(name: str) -> None:
    mod = importlib.import_module(f"{_PKG}.{name}")
    r = getattr(mod, f"{name}_stub")(f"sal-{name}")
    assert r["integrity_status"] == "ok"
    assert float(r["runtime_confidence"]) > 0
