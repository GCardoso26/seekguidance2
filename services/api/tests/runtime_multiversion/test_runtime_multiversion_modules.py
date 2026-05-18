"""runtime_multiversion modules."""
from __future__ import annotations

import importlib

import pytest

_PKG = "app.runtime.runtime_multiversion"
_MODULES = [
    "runtime_multiversion_engine_v1",
    "runtime_version_registry_v1",
    "runtime_backward_compatibility_runtime_v1",
    "runtime_forward_compatibility_runtime_v1",
    "runtime_contract_transition_runtime_v1",
    "runtime_version_adoption_runtime_v1",
    "runtime_version_support_runtime_v1",
    "runtime_version_deprecation_runtime_v1",
    "runtime_version_stability_runtime_v1",
    "runtime_multiversion_summary_v1",
]


@pytest.mark.parametrize("name", _MODULES)
def test_mv_stub(name: str) -> None:
    mod = importlib.import_module(f"{_PKG}.{name}")
    stub = getattr(mod, f"{name}_stub")
    r = stub(f"mv-{name}")
    assert r["integrity_status"] == "ok"
    assert float(r["runtime_confidence"]) > 0


def test_multiversion_summary_engine() -> None:
    from app.runtime.runtime_multiversion.runtime_multiversion_summary_v1 import runtime_multiversion_engine_v1

    assert runtime_multiversion_engine_v1("mv-sum")["multiversion_score"] > 0
