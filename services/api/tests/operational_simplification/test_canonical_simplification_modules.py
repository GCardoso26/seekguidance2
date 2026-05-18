"""canonical operational simplification modules."""
from __future__ import annotations

import importlib

import pytest

_PKG = "app.runtime.runtime_canonical"
_MODULES = [
    "canonical_runtime_alias_registry_v2",
    "canonical_runtime_deprecation_tracker_v2",
    "canonical_runtime_usage_index_v1",
    "canonical_runtime_support_matrix_v2",
    "canonical_runtime_contract_health_v1",
    "canonical_runtime_import_stability_v1",
    "canonical_runtime_payload_stability_v1",
    "canonical_runtime_release_health_v1",
    "canonical_runtime_backward_compatibility_v2",
    "canonical_runtime_simplification_summary_v1",
]


@pytest.mark.parametrize("name", _MODULES)
def test_canonical_simplification_stub(name: str) -> None:
    mod = importlib.import_module(f"{_PKG}.{name}")
    stub = getattr(mod, f"{name}_stub")
    r = stub(f"simp-{name}")
    assert r["integrity_status"] == "ok"
    assert float(r["runtime_confidence"]) > 0


def test_simplification_summary_engine() -> None:
    from app.runtime.runtime_canonical.canonical_runtime_simplification_summary_v1 import (
        canonical_simplification_engine_v1,
    )

    out = canonical_simplification_engine_v1("simp-eng")
    assert out["simplification_score"] > 0
